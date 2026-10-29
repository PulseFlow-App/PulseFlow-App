-- Scale & security hardening (Oct 2026 review).
-- 1) Block client self-promotion of role/org/billing
-- 2) Private receipts bucket + signed-URL read policy
-- 3) Staff ops reads scoped to assignment / own rows
-- 4) Server-side push dedupe table
-- 5) Invite email lookup helper (profiles.email)

-- ---------------------------------------------------------------------------
-- Protected columns: profiles
-- ---------------------------------------------------------------------------

create or replace function public.enforce_profiles_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role (admin API) may change anything.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.org_id is distinct from old.org_id
     or new.personal_org_id is distinct from old.personal_org_id
  then
    raise exception 'role, org_id and personal_org_id can only be changed by the server';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protected_columns on public.profiles;
create trigger profiles_protected_columns
  before update on public.profiles
  for each row
  execute function public.enforce_profiles_protected_columns();

-- ---------------------------------------------------------------------------
-- Protected columns: organizations (billing / kind)
-- ---------------------------------------------------------------------------

create or replace function public.enforce_organizations_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.subscription_status is distinct from old.subscription_status
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.referral_bonus_ends_at is distinct from old.referral_bonus_ends_at
     or new.referral_year_claimed is distinct from old.referral_year_claimed
     or new.kind is distinct from old.kind
  then
    raise exception 'billing and kind fields can only be changed by the server';
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_protected_columns on public.organizations;
create trigger organizations_protected_columns
  before update on public.organizations
  for each row
  execute function public.enforce_organizations_protected_columns();

-- ---------------------------------------------------------------------------
-- Receipts: private bucket; members may read/write under their org folder
-- ---------------------------------------------------------------------------

update storage.buckets
set public = false
where id = 'receipts';

drop policy if exists "receipts read authenticated" on storage.objects;
drop policy if exists receipts_read on storage.objects;
drop policy if exists receipts_select on storage.objects;

create policy receipts_select on storage.objects
  for select using (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.in_org((storage.foldername(name))[1]::uuid)
  );

drop policy if exists receipts_write on storage.objects;
create policy receipts_write on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.in_org((storage.foldername(name))[1]::uuid)
  );

-- ---------------------------------------------------------------------------
-- Staff assignment helper for ops rows
-- ---------------------------------------------------------------------------

create or replace function public.staff_assigned_to_villa(
  check_org uuid,
  check_villa uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.villa_assignments a
    where a.org_id = check_org
      and a.villa_id = check_villa
      and a.profile_id = auth.uid()
  );
$$;

create or replace function public.can_read_ops_villa_row(
  check_org uuid,
  check_villa uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_org_manager_or_owner(check_org)
    or (
      public.is_non_guest_member(check_org)
      and (
        check_villa is null
        or public.staff_assigned_to_villa(check_org, check_villa)
      )
    );
$$;

-- Tasks: managers/owners see all; staff see assigned-to-them, created-by-them, or assigned villas
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (
    public.is_org_manager_or_owner(org_id)
    or (
      public.is_non_guest_member(org_id)
      and (
        assigned_to = auth.uid()
        or created_by = auth.uid()
        or public.can_read_ops_villa_row(org_id, villa_id)
      )
    )
  );

-- Bills: managers/owners all; staff see own submissions or assigned villa bills
drop policy if exists bills_select on public.bills;
create policy bills_select on public.bills
  for select using (
    public.is_org_manager_or_owner(org_id)
    or (
      public.is_non_guest_member(org_id)
      and (
        submitted_by = auth.uid()
        or public.can_read_ops_villa_row(org_id, villa_id)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Push dedupe (DB-backed; survives multi-instance Vercel)
-- ---------------------------------------------------------------------------

create table if not exists public.push_dedupe (
  dedupe_key text primary key,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_dedupe_created
  on public.push_dedupe (created_at);

alter table public.push_dedupe enable row level security;

drop policy if exists push_dedupe_deny on public.push_dedupe;
create policy push_dedupe_deny on public.push_dedupe
  for all using (false);

create or replace function public.try_claim_push_dedupe(
  p_key text,
  p_ttl_seconds int default 90
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.push_dedupe
  where created_at < now() - make_interval(secs => greatest(p_ttl_seconds, 30));

  begin
    insert into public.push_dedupe (dedupe_key) values (p_key);
    return true;
  exception
    when unique_violation then
      return false;
  end;
end;
$$;

revoke all on function public.try_claim_push_dedupe(text, int) from public;
grant execute on function public.try_claim_push_dedupe(text, int) to service_role;
grant execute on function public.try_claim_push_dedupe(text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Invite email lookup: index profiles.email (accept-invite prefers this over
-- paginating auth.admin.listUsers)
-- ---------------------------------------------------------------------------

create index if not exists idx_profiles_email_lower
  on public.profiles (lower(email));

-- ---------------------------------------------------------------------------
-- Audit helper view (run in SQL editor; does not change data)
-- ---------------------------------------------------------------------------

create or replace view public.audit_profile_role_mismatches as
select
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role as profile_role,
  p.org_id,
  m.role as membership_role,
  m.org_id as membership_org_id
from public.profiles p
left join public.org_memberships m
  on m.profile_id = p.id
 and m.org_id = p.org_id
where m.id is null
   or m.role is distinct from p.role;

comment on view public.audit_profile_role_mismatches is
  'Profiles whose primary org membership is missing or role mismatches. Review after deploying 059.';

-- MVP security hardening: guest isolation, entitlement expiry, storage paths,
-- stay-request / cancel rules that were only enforced in the client.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.role_in_org(check_org uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select m.role
      from public.org_memberships m
      where m.profile_id = auth.uid()
        and m.org_id = check_org
      limit 1
    ),
    (
      select p.role
      from public.profiles p
      where p.id = auth.uid()
        and p.org_id = check_org
      limit 1
    )
  );
$$;

create or replace function public.is_non_guest_member(check_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.in_org(check_org)
    and coalesce(public.role_in_org(check_org), 'guest') is distinct from 'guest';
$$;

-- Trialing is not forever: require an unexpired trial date (or active paid).
create or replace function public.company_is_entitled(check_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when o.kind = 'personal' then true
    when o.subscription_status = 'active' then true
    when o.subscription_status = 'trialing'
      and o.trial_ends_at is not null
      and o.trial_ends_at > now() then true
    when o.trial_ends_at is not null and o.trial_ends_at > now() then true
    when o.referral_bonus_ends_at is not null
      and o.referral_bonus_ends_at > now() then true
    else false
  end
  from public.organizations o
  where o.id = check_org;
$$;

-- ---------------------------------------------------------------------------
-- Villas: guests must not mutate property records
-- ---------------------------------------------------------------------------

drop policy if exists villas_update on public.villas;
create policy villas_update on public.villas
  for update using (
    public.is_non_guest_member(org_id)
    and public.company_write_allowed(org_id)
  );

drop policy if exists villas_insert on public.villas;
create policy villas_insert on public.villas
  for insert with check (
    public.is_non_guest_member(org_id)
    and public.company_write_allowed(org_id)
    and (
      public.is_org_manager_or_owner(org_id)
      or created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Tasks / bills / contacts / team messages: no guest access
-- ---------------------------------------------------------------------------

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (public.is_non_guest_member(org_id));

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert with check (
    public.is_non_guest_member(org_id)
    and public.company_write_allowed(org_id)
  );

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update using (
    public.is_non_guest_member(org_id)
    and public.company_write_allowed(org_id)
  );

drop policy if exists bills_select on public.bills;
create policy bills_select on public.bills
  for select using (public.is_non_guest_member(org_id));

drop policy if exists contacts_select on public.contacts;
create policy contacts_select on public.contacts
  for select using (public.is_non_guest_member(org_id));

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (public.is_non_guest_member(org_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    public.is_non_guest_member(org_id)
    and public.company_write_allowed(org_id)
    and sender_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- House guides: guests only for villas they are booked on
-- ---------------------------------------------------------------------------

drop policy if exists house_guides_select on public.house_guides;
create policy house_guides_select on public.house_guides for select using (
  public.is_non_guest_member(org_id)
  or exists (
    select 1
    from public.guest_stays s
    where s.villa_id = house_guides.villa_id
      and s.guest_profile_id = auth.uid()
      and s.status in ('upcoming', 'active')
  )
);

-- ---------------------------------------------------------------------------
-- Stay date requests: guests may only decline pending/quoted (not rewrite prices)
-- ---------------------------------------------------------------------------

create or replace function public.enforce_stay_date_request_guest_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_org_manager_or_owner(old.org_id) then
    return new;
  end if;

  if old.guest_profile_id is distinct from auth.uid() then
    raise exception 'Not allowed to update this date request.';
  end if;

  if old.status not in ('pending', 'quoted')
     or new.status is distinct from 'declined' then
    raise exception 'Guests may only decline a pending or quoted request.';
  end if;

  if new.org_id is distinct from old.org_id
     or new.villa_id is distinct from old.villa_id
     or new.guest_profile_id is distinct from old.guest_profile_id
     or new.check_in is distinct from old.check_in
     or new.check_out is distinct from old.check_out
     or new.guest_price_amount is distinct from old.guest_price_amount
     or new.guest_price_currency is distinct from old.guest_price_currency
     or new.quoted_price_amount is distinct from old.quoted_price_amount
     or new.quoted_price_currency is distinct from old.quoted_price_currency
     or new.quoted_deposit_amount is distinct from old.quoted_deposit_amount
     or new.quoted_deposit_currency is distinct from old.quoted_deposit_currency
     or new.quoted_deposit_timing is distinct from old.quoted_deposit_timing
  then
    raise exception 'Guests cannot change quote or booking fields.';
  end if;

  return new;
end;
$$;

drop trigger if exists stay_date_request_guest_update_guard on public.stay_date_requests;
create trigger stay_date_request_guest_update_guard
  before update on public.stay_date_requests
  for each row
  execute function public.enforce_stay_date_request_guest_update();

-- ---------------------------------------------------------------------------
-- Guest self-cancel: enforce 3 calendar days in RLS (was client-only)
-- ---------------------------------------------------------------------------

drop policy if exists guest_stays_guest_cancel on public.guest_stays;
create policy guest_stays_guest_cancel on public.guest_stays
  for update
  using (
    guest_profile_id = auth.uid()
    and status = 'upcoming'
    and check_in >= (current_date + 3)
  )
  with check (
    guest_profile_id = auth.uid()
    and status = 'cancelled'
  );

-- ---------------------------------------------------------------------------
-- Storage: require org folder prefix the user belongs to
-- ---------------------------------------------------------------------------

drop policy if exists villa_photos_write on storage.objects;
create policy villa_photos_write on storage.objects
  for insert with check (
    bucket_id = 'villas'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.in_org((storage.foldername(name))[1]::uuid)
    and public.is_non_guest_member((storage.foldername(name))[1]::uuid)
  );

-- Guests may upload support attachments under their org folder; staff upload bills.
drop policy if exists receipts_write on storage.objects;
create policy receipts_write on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.in_org((storage.foldername(name))[1]::uuid)
  );

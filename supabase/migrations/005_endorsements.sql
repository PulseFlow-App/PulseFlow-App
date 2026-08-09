-- Weekly endorsements + multi-company memberships + shareable profiles

alter table public.profiles
  add column if not exists share_slug text unique;

alter table public.profiles
  add column if not exists personal_org_id uuid references public.organizations (id);

create table if not exists public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'cleaner', 'staff')),
  joined_at timestamptz not null default now(),
  unique (org_id, profile_id)
);

create index if not exists idx_memberships_profile on public.org_memberships (profile_id);
create index if not exists idx_memberships_org on public.org_memberships (org_id);

create table if not exists public.endorsements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  to_profile_id uuid not null references public.profiles (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  week_key text not null,
  note text,
  created_at timestamptz not null default now(),
  unique (org_id, from_profile_id, to_profile_id, week_key)
);

create index if not exists idx_endorsements_to on public.endorsements (to_profile_id);
create index if not exists idx_endorsements_org on public.endorsements (org_id);

alter table public.org_memberships enable row level security;
alter table public.endorsements enable row level security;

create policy "memberships read authenticated"
  on public.org_memberships for select
  to authenticated
  using (true);

create policy "endorsements read authenticated"
  on public.endorsements for select
  to authenticated
  using (true);

create policy "endorsements insert owner"
  on public.endorsements for insert
  with check (
    org_id = public.current_org_id()
    and from_profile_id = auth.uid()
    and public.current_role() = 'owner'
  );

-- Expand roles, org kind, invites, villa assignments

alter table public.organizations
  add column if not exists kind text not null default 'company'
  check (kind in ('personal', 'company'));

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'manager', 'cleaner', 'staff'));

alter table public.profiles
  add column if not exists email text,
  add column if not exists job_title text;

alter table public.villas
  add column if not exists created_by uuid references public.profiles (id) on delete set null;

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  org_id uuid not null references public.organizations (id) on delete cascade,
  role text not null check (role in ('manager', 'cleaner', 'staff')),
  full_name text,
  email text,
  phone text,
  job_title text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references public.profiles (id) on delete set null
);

create index if not exists idx_invites_org on public.invites (org_id);
create index if not exists idx_invites_token on public.invites (token);

create table if not exists public.villa_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  villa_id uuid not null references public.villas (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  unique (villa_id, profile_id)
);

create index if not exists idx_villa_assignments_org on public.villa_assignments (org_id);
create index if not exists idx_villa_assignments_profile on public.villa_assignments (profile_id);

alter table public.invites enable row level security;
alter table public.villa_assignments enable row level security;

create policy "invites select org"
  on public.invites for select
  using (org_id = public.current_org_id());

create policy "invites insert inviters"
  on public.invites for insert
  with check (
    org_id = public.current_org_id()
    and public.current_role() in ('owner', 'manager')
    and role <> 'owner'
    and (
      public.current_role() = 'owner'
      or role in ('cleaner', 'staff')
    )
  );

create policy "assignments select org"
  on public.villa_assignments for select
  using (org_id = public.current_org_id());

create policy "assignments write owner"
  on public.villa_assignments for all
  using (
    org_id = public.current_org_id() and public.current_role() = 'owner'
  )
  with check (
    org_id = public.current_org_id() and public.current_role() = 'owner'
  );

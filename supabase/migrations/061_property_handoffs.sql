-- Property handoff: move selected personal villas into an owner's company.
-- Manager (or personal owner) invites a real owner; on accept, villas move
-- and the inviter becomes/stays manager on that company.

create table if not exists public.property_handoffs (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  personal_org_id uuid not null references public.organizations (id) on delete cascade,
  villa_ids uuid[] not null,
  to_email text not null,
  to_full_name text,
  -- true = create company_name on accept; false = attach to owner's existing company
  create_company boolean not null default true,
  company_name text,
  -- Optional at create; required by accept when create_company is false
  target_org_id uuid references public.organizations (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  resulting_org_id uuid references public.organizations (id) on delete set null,
  constraint property_handoffs_create_name check (
    create_company = false
    or (company_name is not null and length(trim(company_name)) > 0)
  ),
  constraint property_handoffs_villas_nonempty check (cardinality(villa_ids) >= 1)
);

create index if not exists idx_property_handoffs_token
  on public.property_handoffs (token);
create index if not exists idx_property_handoffs_from
  on public.property_handoffs (from_profile_id);
create index if not exists idx_property_handoffs_email
  on public.property_handoffs (lower(to_email));

alter table public.property_handoffs enable row level security;

drop policy if exists property_handoffs_select_own on public.property_handoffs;
create policy property_handoffs_select_own on public.property_handoffs
  for select using (from_profile_id = auth.uid());

drop policy if exists property_handoffs_insert_own on public.property_handoffs;
create policy property_handoffs_insert_own on public.property_handoffs
  for insert with check (from_profile_id = auth.uid());

drop policy if exists property_handoffs_update_own on public.property_handoffs;
create policy property_handoffs_update_own on public.property_handoffs
  for update using (
    from_profile_id = auth.uid()
    and status = 'pending'
  )
  with check (from_profile_id = auth.uid());

comment on table public.property_handoffs is
  'Invite an owner to take personal villas into a company; accept moves org_id on those villas.';

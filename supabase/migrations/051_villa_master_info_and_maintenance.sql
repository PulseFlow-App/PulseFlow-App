-- Property ops handoff: master info (team) + maintenance log with optional photo.
-- Inspired by “someone could run this property without me” file hygiene.

create table if not exists public.villa_master_info (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  villa_id uuid not null references public.villas (id) on delete cascade,
  utilities_notes text,
  service_providers_notes text,
  access_notes text,
  key_contacts_notes text,
  tax_notes text,
  handoff_notes text,
  updated_at timestamptz not null default now(),
  unique (villa_id)
);

create index if not exists villa_master_info_org_idx
  on public.villa_master_info (org_id);

create table if not exists public.villa_maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  villa_id uuid not null references public.villas (id) on delete cascade,
  item text not null,
  logged_on date not null default current_date,
  description text,
  vendor text,
  photo_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists villa_maintenance_logs_villa_idx
  on public.villa_maintenance_logs (villa_id, logged_on desc);

alter table public.villa_master_info enable row level security;
alter table public.villa_maintenance_logs enable row level security;

-- Team members in the org can read; guests cannot.
drop policy if exists villa_master_info_select on public.villa_master_info;
create policy villa_master_info_select on public.villa_master_info
  for select using (
    public.is_non_guest_member(org_id)
  );

drop policy if exists villa_master_info_write on public.villa_master_info;
create policy villa_master_info_write on public.villa_master_info
  for all using (
    public.is_org_manager_or_owner(org_id)
  ) with check (
    public.is_org_manager_or_owner(org_id)
  );

drop policy if exists villa_maintenance_logs_select on public.villa_maintenance_logs;
create policy villa_maintenance_logs_select on public.villa_maintenance_logs
  for select using (
    public.is_non_guest_member(org_id)
  );

drop policy if exists villa_maintenance_logs_insert on public.villa_maintenance_logs;
create policy villa_maintenance_logs_insert on public.villa_maintenance_logs
  for insert with check (
    public.is_non_guest_member(org_id)
    and created_by = auth.uid()
  );

drop policy if exists villa_maintenance_logs_update on public.villa_maintenance_logs;
create policy villa_maintenance_logs_update on public.villa_maintenance_logs
  for update using (
    public.is_org_manager_or_owner(org_id)
    or created_by = auth.uid()
  ) with check (
    public.is_org_manager_or_owner(org_id)
    or created_by = auth.uid()
  );

drop policy if exists villa_maintenance_logs_delete on public.villa_maintenance_logs;
create policy villa_maintenance_logs_delete on public.villa_maintenance_logs
  for delete using (
    public.is_org_manager_or_owner(org_id)
    or created_by = auth.uid()
  );

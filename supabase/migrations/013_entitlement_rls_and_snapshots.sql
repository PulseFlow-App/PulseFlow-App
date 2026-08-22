-- Tighten company writes when trial/subscription lapses; handoff snapshots for Basic reporting.

create or replace function public.company_write_allowed(check_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not exists (
      select 1 from public.organizations o where o.id = check_org
    ) then false
    when (select o.kind from public.organizations o where o.id = check_org) = 'personal'
      then true
    else public.company_is_entitled(check_org)
  end;
$$;

-- Handoff / status snapshots (Basic reporting)
create table if not exists public.handoff_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  label text not null default '',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_handoff_snapshots_org
  on public.handoff_snapshots (org_id, created_at desc);

alter table public.handoff_snapshots enable row level security;

create policy handoff_snapshots_select on public.handoff_snapshots
  for select using (public.in_org(org_id));

create policy handoff_snapshots_insert on public.handoff_snapshots
  for insert with check (
    public.in_org(org_id)
    and created_by = auth.uid()
    and public.is_org_manager_or_owner(org_id)
    and public.company_write_allowed(org_id)
  );

create policy handoff_snapshots_delete on public.handoff_snapshots
  for delete using (
    public.in_org(org_id)
    and public.is_org_manager_or_owner(org_id)
    and public.company_write_allowed(org_id)
  );

-- Villas
drop policy if exists villas_insert on public.villas;
drop policy if exists villas_update on public.villas;
drop policy if exists villas_delete on public.villas;

create policy villas_insert on public.villas
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and (
      public.is_org_manager_or_owner(org_id)
      or created_by = auth.uid()
    )
  );

create policy villas_update on public.villas
  for update using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
  );

create policy villas_delete on public.villas
  for delete using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and (
      public.is_org_owner(org_id)
      or created_by = auth.uid()
    )
  );

-- Contacts
drop policy if exists contacts_insert on public.contacts;
drop policy if exists contacts_update on public.contacts;
drop policy if exists contacts_delete on public.contacts;

create policy contacts_insert on public.contacts
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_manager_or_owner(org_id)
  );

create policy contacts_update on public.contacts
  for update using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_manager_or_owner(org_id)
  );

create policy contacts_delete on public.contacts
  for delete using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_manager_or_owner(org_id)
  );

-- Bills
drop policy if exists bills_insert on public.bills;
drop policy if exists bills_update on public.bills;

create policy bills_insert on public.bills
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and submitted_by = auth.uid()
  );

create policy bills_update on public.bills
  for update using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_manager_or_owner(org_id)
  );

-- Tasks
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_update on public.tasks;

create policy tasks_insert on public.tasks
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
  );

create policy tasks_update on public.tasks
  for update using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
  );

-- Messages
drop policy if exists messages_insert on public.messages;

create policy messages_insert on public.messages
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and sender_id = auth.uid()
  );

-- Invites
drop policy if exists invites_insert on public.invites;
drop policy if exists invites_update on public.invites;

create policy invites_insert on public.invites
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_manager_or_owner(org_id)
    and role <> 'owner'
  );

create policy invites_update on public.invites
  for update using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
  );

-- Service orders
drop policy if exists service_orders_insert on public.service_orders;
drop policy if exists service_orders_update on public.service_orders;

create policy service_orders_insert on public.service_orders
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_manager_or_owner(org_id)
  );

create policy service_orders_update on public.service_orders
  for update using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
  );

-- Villa assignments
drop policy if exists "assignments write owner" on public.villa_assignments;
drop policy if exists assignments_write on public.villa_assignments;

create policy assignments_write on public.villa_assignments
  for all using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_owner(org_id)
  )
  with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_owner(org_id)
  );

-- Notifications (app-generated)
drop policy if exists "notifications insert org" on public.notifications;
drop policy if exists notifications_insert on public.notifications;

create policy notifications_insert on public.notifications
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
  );

-- Endorsements
drop policy if exists "endorsements insert owner" on public.endorsements;

create policy endorsements_insert_owner on public.endorsements
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and from_profile_id = auth.uid()
    and public.is_org_owner(org_id)
  );

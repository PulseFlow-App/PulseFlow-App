-- Production readiness: personal org access, manager write rights, villa photos storage

-- Helpers: active org OR personal org
create or replace function public.profile_org_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(distinct oid) filter (where oid is not null),
    array[]::uuid[]
  )
  from (
    select org_id as oid from public.profiles where id = auth.uid()
    union all
    select personal_org_id from public.profiles where id = auth.uid()
    union all
    select org_id from public.org_memberships where profile_id = auth.uid()
  ) s;
$$;

create or replace function public.in_org(check_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select check_org = any (public.profile_org_ids());
$$;

create or replace function public.is_org_manager_or_owner(check_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.org_id = check_org
      and p.role in ('owner', 'manager')
  ) or exists (
    select 1 from public.org_memberships m
    where m.profile_id = auth.uid()
      and m.org_id = check_org
      and m.role in ('owner', 'manager')
  );
$$;

create or replace function public.is_org_owner(check_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.org_id = check_org
      and p.role = 'owner'
  ) or exists (
    select 1 from public.org_memberships m
    where m.profile_id = auth.uid()
      and m.org_id = check_org
      and m.role = 'owner'
  );
$$;

-- Villas: allow personal + company via in_org
drop policy if exists villas_select on public.villas;
drop policy if exists villas_insert on public.villas;
drop policy if exists villas_update on public.villas;
drop policy if exists villas_delete on public.villas;

create policy villas_select on public.villas
  for select using (public.in_org(org_id));

create policy villas_insert on public.villas
  for insert with check (
    public.in_org(org_id)
    and (
      public.is_org_manager_or_owner(org_id)
      or created_by = auth.uid()
    )
  );

create policy villas_update on public.villas
  for update using (public.in_org(org_id));

create policy villas_delete on public.villas
  for delete using (
    public.is_org_owner(org_id)
    or created_by = auth.uid()
  );

-- Contacts: managers can write
drop policy if exists contacts_select on public.contacts;
drop policy if exists contacts_insert on public.contacts;
drop policy if exists contacts_update on public.contacts;
drop policy if exists contacts_delete on public.contacts;

create policy contacts_select on public.contacts
  for select using (public.in_org(org_id));

create policy contacts_insert on public.contacts
  for insert with check (public.is_org_manager_or_owner(org_id));

create policy contacts_update on public.contacts
  for update using (public.is_org_manager_or_owner(org_id));

create policy contacts_delete on public.contacts
  for delete using (public.is_org_manager_or_owner(org_id));

-- Bills: managers can mark paid
drop policy if exists bills_select on public.bills;
drop policy if exists bills_insert on public.bills;
drop policy if exists bills_update on public.bills;

create policy bills_select on public.bills
  for select using (public.in_org(org_id));

create policy bills_insert on public.bills
  for insert with check (public.in_org(org_id) and submitted_by = auth.uid());

create policy bills_update on public.bills
  for update using (public.is_org_manager_or_owner(org_id));

-- Tasks / messages already org-scoped; broaden to in_org where policies exist
drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_update on public.tasks;

create policy tasks_select on public.tasks
  for select using (public.in_org(org_id));

create policy tasks_insert on public.tasks
  for insert with check (public.in_org(org_id));

create policy tasks_update on public.tasks
  for update using (public.in_org(org_id));

drop policy if exists messages_select on public.messages;
drop policy if exists messages_insert on public.messages;

create policy messages_select on public.messages
  for select using (public.in_org(org_id));

create policy messages_insert on public.messages
  for insert with check (public.in_org(org_id) and sender_id = auth.uid());

-- Profiles readable across shared orgs
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.in_org(org_id)
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid());

-- Organizations readable if member
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select using (public.in_org(id));

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update using (public.is_org_owner(id));

-- Storage: villa photos
insert into storage.buckets (id, name, public)
values ('villas', 'villas', true)
on conflict (id) do nothing;

drop policy if exists villa_photos_read on storage.objects;
drop policy if exists villa_photos_write on storage.objects;

create policy villa_photos_read on storage.objects
  for select using (bucket_id = 'villas');

create policy villa_photos_write on storage.objects
  for insert with check (
    bucket_id = 'villas'
    and auth.role() = 'authenticated'
  );

-- Tighten receipts: path must start with an org the user belongs to
drop policy if exists receipts_write on storage.objects;
create policy receipts_write on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
  );

-- Invites / assignments / service orders: personal + company membership
drop policy if exists "invites select org" on public.invites;
drop policy if exists "invites insert inviters" on public.invites;
create policy invites_select on public.invites
  for select using (public.in_org(org_id));
create policy invites_insert on public.invites
  for insert with check (
    public.is_org_manager_or_owner(org_id)
    and role <> 'owner'
  );
create policy invites_update on public.invites
  for update using (public.in_org(org_id));

drop policy if exists "service_orders select org" on public.service_orders;
drop policy if exists "service_orders insert bookers" on public.service_orders;
drop policy if exists "service_orders update org" on public.service_orders;
create policy service_orders_select on public.service_orders
  for select using (public.in_org(org_id));
create policy service_orders_insert on public.service_orders
  for insert with check (public.is_org_manager_or_owner(org_id));
create policy service_orders_update on public.service_orders
  for update using (public.in_org(org_id));

-- Realtime for jobs + alerts (ignore if already members)
do $$
begin
  begin
    alter publication supabase_realtime add table public.service_orders;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;

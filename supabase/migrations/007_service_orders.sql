-- Service bookings + work windows + contact ↔ profile link

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check check (
    kind in (
      'check_in',
      'check_out',
      'urgent_task',
      'task_assigned',
      'message',
      'bill_due',
      'bill_submitted',
      'appointment'
    )
  );

alter table public.contacts
  add column if not exists linked_profile_id uuid references public.profiles (id);

alter table public.tasks
  add column if not exists time_start text;

alter table public.tasks
  add column if not exists time_end text;

alter table public.tasks
  add column if not exists service_order_id uuid;

alter table public.messages
  add column if not exists service_order_id uuid;

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  staff_profile_id uuid references public.profiles (id) on delete set null,
  ordered_by uuid not null references public.profiles (id),
  villa_id uuid references public.villas (id) on delete set null,
  location_label text,
  service_type text not null,
  details text,
  scheduled_date date not null,
  time_start text,
  time_end text,
  status text not null check (
    status in ('pending_ack', 'agreed', 'done', 'cancelled')
  ) default 'pending_ack',
  agreed_at timestamptz,
  chat_message_id uuid,
  task_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_service_orders_org on public.service_orders (org_id);
create index if not exists idx_service_orders_staff on public.service_orders (staff_profile_id);

alter table public.service_orders enable row level security;

create policy "service_orders select org"
  on public.service_orders for select
  to authenticated
  using (org_id = public.current_org_id());

create policy "service_orders insert bookers"
  on public.service_orders for insert
  to authenticated
  with check (
    org_id = public.current_org_id()
    and public.current_role() in ('owner', 'manager')
  );

create policy "service_orders update org"
  on public.service_orders for update
  to authenticated
  using (org_id = public.current_org_id());

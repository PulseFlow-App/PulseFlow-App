-- Optional bill due dates + in-app notifications

alter table public.bills
  add column if not exists due_date date;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (
    kind in (
      'check_in',
      'check_out',
      'urgent_task',
      'task_assigned',
      'message',
      'bill_due',
      'bill_submitted'
    )
  ),
  title text not null,
  body text not null,
  href text,
  entity_id text,
  audience_profile_ids uuid[],
  dedupe_key text,
  created_at timestamptz not null default now(),
  read_by uuid[] not null default '{}'
);

create unique index if not exists idx_notifications_dedupe
  on public.notifications (org_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_notifications_org_created
  on public.notifications (org_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications select org"
  on public.notifications for select
  to authenticated
  using (org_id = public.current_org_id());

create policy "notifications insert org"
  on public.notifications for insert
  to authenticated
  with check (org_id = public.current_org_id());

create policy "notifications update org"
  on public.notifications for update
  to authenticated
  using (org_id = public.current_org_id());

-- A request sent from Pulseflow Services to a person who already has an account.
-- The sender and that person can both read the row. Replies stay on the row.

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  target_name text not null,
  title text not null,
  description text not null,
  when_label text,
  reply_message text,
  reply_amount numeric,
  reply_currency text,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

alter table public.service_requests
  drop constraint if exists service_requests_once;
alter table public.service_requests
  add constraint service_requests_once unique (request_id, target_profile_id);

create index if not exists service_requests_target
  on public.service_requests (target_profile_id, created_at desc);

create index if not exists service_requests_sender
  on public.service_requests (created_by, created_at desc);

alter table public.service_requests enable row level security;

drop policy if exists service_requests_select on public.service_requests;
create policy service_requests_select on public.service_requests
  for select to authenticated
  using (created_by = auth.uid() or target_profile_id = auth.uid());

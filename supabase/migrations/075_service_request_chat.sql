-- Chat on a service request. Closed until the work is accepted, unless either person opens it early.
-- Apply this in the Supabase SQL editor. The app does not apply it.

alter table public.service_requests
  add column if not exists chat_open boolean not null default false;

create table if not exists public.service_request_messages (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references public.service_requests (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '',
  photo_url text,
  created_at timestamptz not null default now(),
  constraint service_request_messages_has_content check (char_length(trim(body)) > 0 or photo_url is not null)
);

create index if not exists service_request_messages_thread
  on public.service_request_messages (service_request_id, created_at);

alter table public.service_request_messages enable row level security;

drop policy if exists service_request_messages_select on public.service_request_messages;
create policy service_request_messages_select on public.service_request_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.service_requests r
      where r.id = service_request_id
        and (r.created_by = auth.uid() or r.target_profile_id = auth.uid())
        and (r.chat_open or r.reply_message is not null)
    )
  );

drop policy if exists service_request_messages_insert on public.service_request_messages;
create policy service_request_messages_insert on public.service_request_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.service_requests r
      where r.id = service_request_id
        and (r.created_by = auth.uid() or r.target_profile_id = auth.uid())
        and (r.chat_open or r.reply_message is not null)
    )
  );

insert into storage.buckets (id, name, public)
values ('service-chat', 'service-chat', true)
on conflict (id) do nothing;

drop policy if exists service_chat_read on storage.objects;
create policy service_chat_read on storage.objects
  for select using (bucket_id = 'service-chat');

-- Team chat channels + optional image attachments (photo-proof thread).
alter table public.messages
  add column if not exists channel text not null default 'general';

alter table public.messages
  drop constraint if exists messages_channel_check;

alter table public.messages
  add constraint messages_channel_check
  check (channel in ('request', 'photo', 'general'));

alter table public.messages
  add column if not exists attachment_url text;

create index if not exists idx_messages_org_channel_created
  on public.messages (org_id, channel, created_at);

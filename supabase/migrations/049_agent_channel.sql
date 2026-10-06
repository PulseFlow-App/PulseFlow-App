-- Private in-app Agent chat channel (owners/managers slash commands).
alter table public.messages
  drop constraint if exists messages_channel_check;

alter table public.messages
  add constraint messages_channel_check
  check (channel in ('request', 'photo', 'general', 'agent'));

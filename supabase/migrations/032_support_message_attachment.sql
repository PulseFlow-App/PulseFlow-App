-- Receipt / image attachments on support chat messages.

alter table public.support_messages
  add column if not exists attachment_url text;

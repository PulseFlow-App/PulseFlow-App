-- Multiple messengers per contact + Telegram support.
-- Keep legacy messenger / messenger_handle columns in sync with the first entry.

alter table public.contacts
  drop constraint if exists contacts_messenger_check;

alter table public.contacts
  add constraint contacts_messenger_check
  check (messenger in ('whatsapp', 'line', 'telegram', 'none'));

alter table public.contacts
  add column if not exists messengers jsonb not null default '[]'::jsonb;

update public.contacts
set messengers = case
  when messenger is null or messenger = 'none' then '[]'::jsonb
  when messenger_handle is not null and length(trim(messenger_handle)) > 0 then
    jsonb_build_array(
      jsonb_build_object('kind', messenger, 'handle', trim(messenger_handle))
    )
  else
    jsonb_build_array(jsonb_build_object('kind', messenger, 'handle', null))
end
where coalesce(jsonb_array_length(messengers), 0) = 0
  and messenger is not null
  and messenger <> 'none';

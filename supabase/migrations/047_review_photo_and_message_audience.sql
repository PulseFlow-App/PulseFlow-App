-- Job review photo on endorsements + restricted team-chat audience for review posts.

alter table public.endorsements
  add column if not exists photo_url text;

alter table public.endorsements
  add column if not exists work_label text;

alter table public.messages
  add column if not exists audience_profile_ids uuid[];

comment on column public.messages.audience_profile_ids is
  'When set, only these profiles see the message (plus used for job reviews). Null = whole org.';

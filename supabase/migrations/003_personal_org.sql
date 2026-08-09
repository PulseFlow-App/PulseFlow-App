-- Personal workspace alongside company membership

alter table public.profiles
  add column if not exists personal_org_id uuid references public.organizations (id);

comment on column public.profiles.personal_org_id is
  'Personal ops workspace for side villas; kept when user joins a company via invite.';

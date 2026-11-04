-- Choice when the same person uses Pulse Flow and Pulseflow Services.
-- merged: company tasks and personal gigs show in both apps.
-- separate: each app keeps its own work.

alter table public.profiles
  add column if not exists account_link text;

alter table public.profiles
  drop constraint if exists profiles_account_link_check;

alter table public.profiles
  add constraint profiles_account_link_check
  check (account_link is null or account_link in ('merged', 'separate'));

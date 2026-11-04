-- Why this person uses Pulseflow Services.
-- hire: they registered to look for staff.
-- work: they registered as maintenance.

alter table public.profiles
  add column if not exists services_intent text;

alter table public.profiles
  drop constraint if exists profiles_services_intent_check;

alter table public.profiles
  add constraint profiles_services_intent_check
  check (services_intent is null or services_intent in ('hire', 'work'));

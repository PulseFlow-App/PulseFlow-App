-- Nationality is for work-permit reminders. It is not the country where someone works.
alter table public.profiles
  add column if not exists nationality text;

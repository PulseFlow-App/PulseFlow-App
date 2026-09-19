-- Per-user lock-screen alert category preferences (jobs, messages, …).
-- Missing keys are treated as enabled (opt-out).

alter table public.profiles
  add column if not exists push_prefs jsonb not null default '{}'::jsonb;

comment on column public.profiles.push_prefs is
  'Web Push category toggles: { jobs, messages, tasks, bills, schedule, team, stay }. Missing key = on.';

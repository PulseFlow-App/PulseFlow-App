-- Per-user Education mode progress (owners/managers). Source of truth for tour state.

create table if not exists public.education_progress (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  started_at timestamptz,
  current_step_id text,
  steps jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  dismissed_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.education_progress is
  'Education mode tour progress per profile. Demo seats must not write.';

alter table public.education_progress enable row level security;

drop policy if exists education_progress_select_own on public.education_progress;
create policy education_progress_select_own on public.education_progress
  for select using (profile_id = auth.uid());

drop policy if exists education_progress_insert_own on public.education_progress;
create policy education_progress_insert_own on public.education_progress
  for insert with check (profile_id = auth.uid());

drop policy if exists education_progress_update_own on public.education_progress;
create policy education_progress_update_own on public.education_progress
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

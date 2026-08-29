-- Opt-in talent directory for field staff and managers

alter table public.profiles
  add column if not exists job_search_visible boolean not null default false,
  add column if not exists job_search_skills text[] not null default '{}',
  add column if not exists job_search_bio text,
  add column if not exists job_search_updated_at timestamptz;

create index if not exists idx_profiles_job_search_visible
  on public.profiles (job_search_visible)
  where job_search_visible = true;

create index if not exists idx_profiles_job_search_skills
  on public.profiles using gin (job_search_skills);

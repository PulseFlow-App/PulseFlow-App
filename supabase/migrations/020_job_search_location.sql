-- Talent directory locations (global search)

alter table public.profiles
  add column if not exists job_search_location text,
  add column if not exists job_search_country text,
  add column if not exists job_search_lat double precision,
  add column if not exists job_search_lng double precision;

create index if not exists idx_profiles_job_search_country
  on public.profiles (job_search_country)
  where job_search_visible = true and job_search_country is not null;

create index if not exists idx_profiles_job_search_geo
  on public.profiles (job_search_lat, job_search_lng)
  where job_search_visible = true
    and job_search_lat is not null
    and job_search_lng is not null;

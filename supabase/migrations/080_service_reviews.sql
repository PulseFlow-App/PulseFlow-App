-- Customer reviews of marketplace staff after a finished job.

create table if not exists public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text not null default '',
  answers jsonb not null default '{}'::jsonb,
  original_locale text not null default 'en',
  created_at timestamptz not null default now(),
  constraint service_reviews_request_once unique (request_id)
);

create index if not exists service_reviews_target
  on public.service_reviews (target_profile_id, created_at desc);

alter table public.service_reviews enable row level security;

drop policy if exists service_reviews_select on public.service_reviews;
create policy service_reviews_select on public.service_reviews
  for select to authenticated
  using (true);

drop policy if exists service_reviews_insert on public.service_reviews;
create policy service_reviews_insert on public.service_reviews
  for insert to authenticated
  with check (author_id = auth.uid());

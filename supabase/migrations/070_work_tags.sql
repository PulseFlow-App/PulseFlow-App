-- Short tags on a Services profile: tools and kinds of work, such as Karcher or furniture.

alter table public.profiles
  add column if not exists job_search_tags text[] not null default '{}';

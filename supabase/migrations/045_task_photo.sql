-- Optional example photo on a task (what to do). One image is enough;
-- extra photos can go in team chat after the job is agreed.

alter table public.tasks
  add column if not exists photo_url text;

comment on column public.tasks.photo_url is
  'Optional example photo from the creator showing what needs doing.';

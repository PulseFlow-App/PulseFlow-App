-- Optional notes on tasks (shown on task cards and synced into job chat details).

alter table public.tasks
  add column if not exists notes text;

comment on column public.tasks.notes is
  'Optional free-text notes from the person who created the task.';

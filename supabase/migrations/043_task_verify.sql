-- Task completion verification: staff/managers submit proof; owner/manager approves.

alter table public.tasks
  drop constraint if exists tasks_status_check;

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('open', 'pending_verify', 'done'));

alter table public.tasks
  add column if not exists verify_notes text,
  add column if not exists verify_photo_url text,
  add column if not exists verify_submitted_by uuid references public.profiles (id) on delete set null,
  add column if not exists verify_submitted_at timestamptz;

comment on column public.tasks.verify_notes is
  'Optional notes from the person who requested task completion verification.';
comment on column public.tasks.verify_photo_url is
  'Optional proof photo URL for task completion verification.';

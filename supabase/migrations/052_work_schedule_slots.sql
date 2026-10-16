-- Discrete visit times + recurrence for tasks and service orders.
-- "Window" = on site from time_start until time_end.
-- "Slots" = come at listed clock times only (e.g. 09:00 and 18:00).

alter table public.tasks
  add column if not exists schedule_mode text not null default 'window'
    check (schedule_mode in ('window', 'slots')),
  add column if not exists time_slots text[] default null,
  add column if not exists recurrence text not null default 'once'
    check (recurrence in ('once', 'daily', 'weekdays')),
  add column if not exists recurrence_count integer default null
    check (recurrence_count is null or recurrence_count >= 1);

alter table public.service_orders
  add column if not exists schedule_mode text not null default 'window'
    check (schedule_mode in ('window', 'slots')),
  add column if not exists time_slots text[] default null,
  add column if not exists recurrence text not null default 'once'
    check (recurrence in ('once', 'daily', 'weekdays')),
  add column if not exists recurrence_count integer default null
    check (recurrence_count is null or recurrence_count >= 1);

comment on column public.tasks.schedule_mode is
  'window = From–Until hours; slots = discrete visit clock times in time_slots';
comment on column public.tasks.time_slots is
  'HH:mm visit times when schedule_mode = slots';
comment on column public.tasks.recurrence is
  'once | daily | weekdays — series starts on due_date';
comment on column public.service_orders.schedule_mode is
  'window = From–Until hours; slots = discrete visit clock times in time_slots';

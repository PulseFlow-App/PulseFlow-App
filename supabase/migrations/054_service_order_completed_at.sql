-- Persist when a service order was marked done (job progress timeline).

alter table public.service_orders
  add column if not exists completed_at timestamptz;

-- Backfill done rows that never recorded a completion time.
update public.service_orders
set completed_at = coalesce(agreed_at, created_at)
where status = 'done'
  and completed_at is null;

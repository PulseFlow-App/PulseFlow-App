-- A quote is a price or a range. The appointment exists only after the customer accepts it.
-- Apply this in the Supabase SQL editor. The app does not apply it.

alter table public.service_requests
  add column if not exists quote_max numeric,
  add column if not exists accepted_at timestamptz,
  add column if not exists photos jsonb not null default '[]'::jsonb;

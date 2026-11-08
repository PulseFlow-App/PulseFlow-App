-- Staff propose a precise visit time with the quote. The customer accepts price and time together.
-- Apply this in the Supabase SQL editor. The app does not apply it.

alter table public.service_requests
  add column if not exists visit_time text;

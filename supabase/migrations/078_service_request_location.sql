-- Area is visible on every request. Exact share_location is only shown to staff after the customer accepts the quote.

alter table public.service_requests
  add column if not exists area_label text,
  add column if not exists share_location text;

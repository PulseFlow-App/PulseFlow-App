-- Pricing fields for guest date requests (guest offer + owner quote on accept).
alter table public.stay_date_requests
  add column if not exists guest_price_amount numeric,
  add column if not exists guest_price_currency text,
  add column if not exists quoted_price_amount numeric,
  add column if not exists quoted_price_currency text,
  add column if not exists payment_note text;

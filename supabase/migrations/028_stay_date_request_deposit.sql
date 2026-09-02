-- Deposit amount requested with the stay price quote.

alter table public.stay_date_requests
  add column if not exists quoted_deposit_amount numeric,
  add column if not exists quoted_deposit_currency text;

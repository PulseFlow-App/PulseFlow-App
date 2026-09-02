-- Deposit timing on quotes and due status before host confirms receipt.

alter table public.stay_date_requests
  add column if not exists quoted_deposit_timing text
    check (
      quoted_deposit_timing is null
      or quoted_deposit_timing in ('before_arrival', 'on_arrival')
    );

alter table public.guest_deposits
  add column if not exists deposit_timing text
    check (
      deposit_timing is null
      or deposit_timing in ('before_arrival', 'on_arrival')
    );

alter table public.guest_deposits
  drop constraint if exists guest_deposits_status_check;

alter table public.guest_deposits
  add constraint guest_deposits_status_check
    check (status in ('due', 'held', 'partial', 'refunded'));

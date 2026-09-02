-- Allow hosts (and later guests) to cancel a booking without deleting history.

alter table public.guest_stays
  drop constraint if exists guest_stays_status_check;

alter table public.guest_stays
  add constraint guest_stays_status_check
  check (status in ('upcoming', 'active', 'completed', 'cancelled'));

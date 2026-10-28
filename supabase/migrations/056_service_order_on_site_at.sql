-- Staff "on site" checkpoint between Read & agreed and Mark done.

alter table public.service_orders
  add column if not exists on_site_at timestamptz;

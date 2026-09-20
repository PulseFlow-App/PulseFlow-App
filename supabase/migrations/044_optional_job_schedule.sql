-- Allow undated jobs ("soon" / no fixed day).
alter table public.service_orders
  alter column scheduled_date drop not null;

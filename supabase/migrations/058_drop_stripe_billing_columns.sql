-- App Store / StoreKit path: drop unused legacy web-checkout billing columns.
drop index if exists public.idx_organizations_stripe_customer;

alter table public.organizations
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id;

-- Company billing: trial + Stripe subscription fields

alter table public.organizations
  add column if not exists trial_ends_at timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text
    not null default 'none'
    check (subscription_status in (
      'none', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
    )),
  add column if not exists billing_email text;

-- Existing company orgs: start a 30-day trial from now if unset
update public.organizations
set
  trial_ends_at = coalesce(trial_ends_at, now() + interval '30 days'),
  subscription_status = case
    when kind = 'company' and subscription_status = 'none' then 'trialing'
    else subscription_status
  end
where kind = 'company';

-- Personal orgs never trial/subscribe
update public.organizations
set
  trial_ends_at = null,
  subscription_status = 'none',
  stripe_customer_id = null,
  stripe_subscription_id = null
where kind = 'personal';

create or replace function public.company_is_entitled(check_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when o.kind = 'personal' then true
    when o.subscription_status in ('trialing', 'active') then true
    when o.trial_ends_at is not null and o.trial_ends_at > now() then true
    else false
  end
  from public.organizations o
  where o.id = check_org;
$$;

create index if not exists idx_organizations_stripe_customer
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;

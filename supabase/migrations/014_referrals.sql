-- Referral credits: 5 joins → 1 year Full on referrer's company org

create table if not exists public.referral_credits (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null references public.profiles (id) on delete cascade,
  source text not null check (source in ('register', 'invite')),
  created_at timestamptz not null default now(),
  unique (referred_id)
);

create index if not exists idx_referral_credits_referrer
  on public.referral_credits (referrer_id, created_at desc);

alter table public.organizations
  add column if not exists referral_bonus_ends_at timestamptz,
  add column if not exists referral_year_claimed boolean not null default false;

alter table public.referral_credits enable row level security;

create policy referral_credits_select_own on public.referral_credits
  for select using (referrer_id = auth.uid());

-- Inserts only via service role (register / accept-invite APIs)

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
    when o.referral_bonus_ends_at is not null and o.referral_bonus_ends_at > now() then true
    else false
  end
  from public.organizations o
  where o.id = check_org;
$$;

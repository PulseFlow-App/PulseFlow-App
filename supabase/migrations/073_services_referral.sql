alter table public.profiles
  add column if not exists services_referral_discount boolean not null default false;

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.referral_credits'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%source%';
  if cname is not null then
    execute format('alter table public.referral_credits drop constraint %I', cname);
  end if;
end $$;

alter table public.referral_credits
  drop constraint if exists referral_credits_source_check;

alter table public.referral_credits
  add constraint referral_credits_source_check
  check (source in ('register', 'invite', 'services'));

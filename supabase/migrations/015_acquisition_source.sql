-- Channel attribution from invite/referral links (?src=, utm_*).
alter table public.organizations
  add column if not exists acquisition_source text;

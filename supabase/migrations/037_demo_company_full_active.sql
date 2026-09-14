-- Keep Pulse Flow demo / seed companies entitled so owners are not stuck on "Full expired".
update public.organizations
set
  subscription_status = 'active',
  trial_ends_at = greatest(
    coalesce(trial_ends_at, now()),
    now() + interval '90 days'
  )
where kind = 'company'
  and (
    billing_email ilike '%@pulseflow.site'
    or name in ('Phangan Villas Co.', 'Beachside Stays', 'Villas KPG')
  );

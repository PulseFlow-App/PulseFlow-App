-- Align existing company trials with the promised 90-day Full free window.
-- Older rows used a shorter default (often 30 days), which showed e.g. "14 days left"
-- next to copy that still said "3 months free".

update public.organizations
set
  trial_ends_at = created_at + interval '90 days',
  subscription_status = coalesce(nullif(subscription_status, 'none'), 'trialing')
where kind = 'company'
  and (
    subscription_status is null
    or subscription_status in ('none', 'trialing')
  )
  and (
    trial_ends_at is null
    or trial_ends_at < created_at + interval '90 days'
  );

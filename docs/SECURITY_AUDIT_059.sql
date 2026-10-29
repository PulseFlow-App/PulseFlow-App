-- Run in Supabase SQL editor after applying migration 059.
-- Review rows; do not delete blindly.

-- Profiles whose primary org has no matching membership, or role mismatch.
select * from public.audit_profile_role_mismatches
order by email nulls last;

-- Owners who are not membership owners (possible self-promotion).
select p.id, p.email, p.full_name, p.role, p.org_id, o.name as org_name, o.kind
from public.profiles p
join public.organizations o on o.id = p.org_id
where p.role = 'owner'
  and not exists (
    select 1
    from public.org_memberships m
    where m.profile_id = p.id
      and m.org_id = p.org_id
      and m.role = 'owner'
  )
order by p.created_at nulls last;

-- Orgs marked active without a trial or referral window (possible self-billing).
select id, name, kind, subscription_status, trial_ends_at, referral_bonus_ends_at
from public.organizations
where kind = 'company'
  and subscription_status = 'active'
order by created_at;

-- Fix Supabase lint: View public.audit_profile_role_mismatches is SECURITY DEFINER.
-- Recreate as security_invoker so the caller's RLS/privileges apply, and lock
-- SELECT to service_role (admin audit only — contains emails).

drop view if exists public.audit_profile_role_mismatches;

create view public.audit_profile_role_mismatches
with (security_invoker = true)
as
select
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role as profile_role,
  p.org_id,
  m.role as membership_role,
  m.org_id as membership_org_id
from public.profiles p
left join public.org_memberships m
  on m.profile_id = p.id
 and m.org_id = p.org_id
where m.id is null
   or m.role is distinct from p.role;

comment on view public.audit_profile_role_mismatches is
  'Profiles whose primary org membership is missing or role mismatches. security_invoker; service_role only.';

revoke all on public.audit_profile_role_mismatches from public;
revoke all on public.audit_profile_role_mismatches from anon;
revoke all on public.audit_profile_role_mismatches from authenticated;
grant select on public.audit_profile_role_mismatches to service_role;

-- Allow reading profiles of people who share an org via membership,
-- not only those whose primary org_id matches. Fixes missing assignee
-- names when staff keep a personal primary org and join via membership.

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.in_org(org_id)
    or exists (
      select 1
      from public.org_memberships m
      where m.profile_id = profiles.id
        and public.in_org(m.org_id)
    )
  );

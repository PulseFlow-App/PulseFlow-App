-- Allow current company owners to invite a replacement owner (billing transfer).
-- Founding (no owner yet) stays allowed for managers/owners as in 062.

drop policy if exists invites_insert on public.invites;
create policy invites_insert on public.invites
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_manager_or_owner(org_id)
    and (
      role <> 'owner'
      or not exists (
        select 1
        from public.org_memberships m
        where m.org_id = invites.org_id
          and m.role = 'owner'
      )
      or public.is_org_owner(org_id)
    )
  );

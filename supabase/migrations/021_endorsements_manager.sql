-- Allow company managers (not only owners) to cast weekly endorsements

drop policy if exists endorsements_insert_owner on public.endorsements;
drop policy if exists "endorsements insert owner" on public.endorsements;
drop policy if exists endorsements_update_owner on public.endorsements;

create policy endorsements_insert_ops on public.endorsements
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and from_profile_id = auth.uid()
    and public.is_org_manager_or_owner(org_id)
  );

create policy endorsements_update_ops on public.endorsements
  for update using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and from_profile_id = auth.uid()
    and public.is_org_manager_or_owner(org_id)
  )
  with check (
    public.in_org(org_id)
    and from_profile_id = auth.uid()
    and public.is_org_manager_or_owner(org_id)
  );

-- Allow owners and managers to grant villa access when booking staff on a job.
-- Owners keep full write; managers may insert assignments only.

drop policy if exists assignments_write on public.villa_assignments;
drop policy if exists "assignments write owner" on public.villa_assignments;
drop policy if exists assignments_insert_ops on public.villa_assignments;
drop policy if exists assignments_update_owner on public.villa_assignments;
drop policy if exists assignments_delete_owner on public.villa_assignments;

create policy assignments_insert_ops on public.villa_assignments
  for insert with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_manager_or_owner(org_id)
  );

create policy assignments_update_owner on public.villa_assignments
  for update using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_owner(org_id)
  )
  with check (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_owner(org_id)
  );

create policy assignments_delete_owner on public.villa_assignments
  for delete using (
    public.in_org(org_id)
    and public.company_write_allowed(org_id)
    and public.is_org_owner(org_id)
  );

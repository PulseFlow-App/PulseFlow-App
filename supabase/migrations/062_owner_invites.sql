-- Allow inviting an Owner when a company was founded by a manager (who pays).

alter table public.invites drop constraint if exists invites_role_check;
alter table public.invites
  add constraint invites_role_check
  check (role in ('owner', 'manager', 'cleaner', 'staff', 'guest'));

-- At most one unused owner invite per company.
create unique index if not exists invites_one_open_owner_per_org
  on public.invites (org_id)
  where role = 'owner' and used_at is null;

-- Managers/owners may insert owner invites only while the company has no owner seat.
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
    )
  );

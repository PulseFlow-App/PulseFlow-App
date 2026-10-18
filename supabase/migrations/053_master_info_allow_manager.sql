-- Owner can share master info with managers (default on for existing rows).

alter table public.villa_master_info
  add column if not exists allow_manager_view boolean not null default true;

drop policy if exists villa_master_info_select on public.villa_master_info;
create policy villa_master_info_select on public.villa_master_info
  for select using (
    public.is_org_owner(org_id)
    or (
      allow_manager_view
      and public.is_org_manager_or_owner(org_id)
    )
  );

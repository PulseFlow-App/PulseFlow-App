-- Guest role for stay guests invited by owners/managers

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'manager', 'cleaner', 'staff', 'guest'));

alter table public.invites drop constraint if exists invites_role_check;
alter table public.invites
  add constraint invites_role_check
  check (role in ('manager', 'cleaner', 'staff', 'guest'));

alter table public.org_memberships drop constraint if exists org_memberships_role_check;
alter table public.org_memberships
  add constraint org_memberships_role_check
  check (role in ('owner', 'manager', 'cleaner', 'staff', 'guest'));

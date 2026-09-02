-- Guest must confirm quoted price before stay is booked.

alter table public.stay_date_requests
  drop constraint if exists stay_date_requests_status_check;

alter table public.stay_date_requests
  add constraint stay_date_requests_status_check
  check (status in ('pending', 'quoted', 'accepted', 'declined'));

drop policy if exists stay_date_requests_update on public.stay_date_requests;
create policy stay_date_requests_update on public.stay_date_requests for update using (
  public.is_org_manager_or_owner(org_id)
  or guest_profile_id = auth.uid()
);

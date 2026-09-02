-- Guest may cancel their own upcoming stay (app enforces 3-day rule).
-- Frees villa dates via trigger so guests don't need villas write access.

create or replace function public.sync_villa_on_guest_stay_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.villas v
    set
      check_in = null,
      check_out = null,
      status = 'available',
      updated_at = now()
    where v.id = new.villa_id
      and v.check_in = new.check_in
      and v.check_out = new.check_out;
  end if;
  return new;
end;
$$;

drop trigger if exists guest_stay_cancelled_villa_sync on public.guest_stays;
create trigger guest_stay_cancelled_villa_sync
  after update of status on public.guest_stays
  for each row
  execute function public.sync_villa_on_guest_stay_cancelled();

drop policy if exists guest_stays_guest_cancel on public.guest_stays;
create policy guest_stays_guest_cancel on public.guest_stays
  for update
  using (
    guest_profile_id = auth.uid()
    and status = 'upcoming'
  )
  with check (
    guest_profile_id = auth.uid()
    and status = 'cancelled'
  );

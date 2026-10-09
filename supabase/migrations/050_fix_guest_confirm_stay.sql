-- Fix guest "Accept price & confirm stay": migration 036's guest update guard
-- only allowed status → declined, so confirm_stay_date_request failed when
-- marking the quote accepted. Allow the RPC via a transaction-local flag, and
-- keep guests from setting accepted directly through RLS.

create or replace function public.enforce_stay_date_request_guest_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_org_manager_or_owner(old.org_id) then
    return new;
  end if;

  -- Set by confirm_stay_date_request for the quote-accept booking path.
  if current_setting('pulseflow.confirming_stay', true) = 'on' then
    return new;
  end if;

  if old.guest_profile_id is distinct from auth.uid() then
    raise exception 'Not allowed to update this date request.';
  end if;

  if old.status not in ('pending', 'quoted')
     or new.status is distinct from 'declined' then
    raise exception 'Guests may only decline a pending or quoted request.';
  end if;

  if new.org_id is distinct from old.org_id
     or new.villa_id is distinct from old.villa_id
     or new.guest_profile_id is distinct from old.guest_profile_id
     or new.check_in is distinct from old.check_in
     or new.check_out is distinct from old.check_out
     or new.guest_price_amount is distinct from old.guest_price_amount
     or new.guest_price_currency is distinct from old.guest_price_currency
     or new.quoted_price_amount is distinct from old.quoted_price_amount
     or new.quoted_price_currency is distinct from old.quoted_price_currency
     or new.quoted_deposit_amount is distinct from old.quoted_deposit_amount
     or new.quoted_deposit_currency is distinct from old.quoted_deposit_currency
     or new.quoted_deposit_timing is distinct from old.quoted_deposit_timing
  then
    raise exception 'Guests cannot change quote or booking fields.';
  end if;

  return new;
end;
$$;

create or replace function public.confirm_stay_date_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.stay_date_requests%rowtype;
  v_stay_status text;
  v_villa_status text;
  v_stay_id uuid;
  v_deposit_timing text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  -- Let the guest update guard allow quoted → accepted for this transaction only.
  perform set_config('pulseflow.confirming_stay', 'on', true);

  select * into r
  from public.stay_date_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Quote not found or already handled.';
  end if;

  if r.guest_profile_id <> auth.uid() then
    raise exception 'Only the guest can confirm a price quote.';
  end if;

  if r.status not in ('quoted', 'accepted') then
    raise exception 'Quote not found or already handled.';
  end if;

  if r.quoted_price_amount is null or r.quoted_price_currency is null then
    raise exception 'This quote is missing a price.';
  end if;

  v_stay_status := public.derive_guest_stay_status_from_dates(r.check_in, r.check_out);
  v_villa_status := public.derive_villa_status_from_dates(r.check_in, r.check_out);

  if r.status = 'quoted' then
    update public.stay_date_requests
    set status = 'accepted'
    where id = p_request_id;
  end if;

  update public.villas
  set
    check_in = r.check_in,
    check_out = r.check_out,
    status = v_villa_status,
    updated_at = now()
  where id = r.villa_id;

  select gs.id into v_stay_id
  from public.guest_stays gs
  where gs.guest_profile_id = r.guest_profile_id
    and gs.villa_id = r.villa_id
    and gs.check_in = r.check_in
    and gs.check_out = r.check_out
    and gs.status in ('upcoming', 'active', 'completed')
  order by gs.created_at desc
  limit 1;

  if v_stay_id is null then
    select gs.id into v_stay_id
    from public.guest_stays gs
    where gs.guest_profile_id = r.guest_profile_id
      and gs.villa_id = r.villa_id
      and gs.status in ('upcoming', 'active')
    limit 1;
  end if;

  if v_stay_id is not null then
    update public.guest_stays
    set
      check_in = r.check_in,
      check_out = r.check_out,
      status = v_stay_status
    where id = v_stay_id;
  else
    insert into public.guest_stays (
      org_id,
      villa_id,
      guest_profile_id,
      check_in,
      check_out,
      status
    ) values (
      r.org_id,
      r.villa_id,
      r.guest_profile_id,
      r.check_in,
      r.check_out,
      v_stay_status
    )
    returning id into v_stay_id;
  end if;

  if r.quoted_deposit_amount is not null
     and r.quoted_deposit_amount > 0
     and r.quoted_deposit_currency is not null then
    v_deposit_timing := coalesce(r.quoted_deposit_timing, 'before_arrival');

    insert into public.guest_deposits (
      org_id,
      stay_id,
      amount,
      currency,
      status,
      notes,
      deposit_timing
    ) values (
      r.org_id,
      v_stay_id,
      r.quoted_deposit_amount,
      r.quoted_deposit_currency,
      'due',
      r.payment_note,
      v_deposit_timing
    )
    on conflict (stay_id) do update set
      amount = excluded.amount,
      currency = excluded.currency,
      status = 'due',
      notes = excluded.notes,
      deposit_timing = excluded.deposit_timing;
  end if;

  return v_stay_id;
end;
$$;

revoke all on function public.confirm_stay_date_request(uuid) from public;
grant execute on function public.confirm_stay_date_request(uuid) to authenticated;

-- Guests may only decline via direct table updates; accept goes through the RPC.
drop policy if exists stay_date_requests_update on public.stay_date_requests;

drop policy if exists stay_date_requests_update_staff on public.stay_date_requests;
create policy stay_date_requests_update_staff on public.stay_date_requests
  for update
  using (public.is_org_manager_or_owner(org_id))
  with check (public.is_org_manager_or_owner(org_id));

drop policy if exists stay_date_requests_update_guest on public.stay_date_requests;
create policy stay_date_requests_update_guest on public.stay_date_requests
  for update
  using (guest_profile_id = auth.uid())
  with check (
    guest_profile_id = auth.uid()
    and status = 'declined'
  );

-- Airbnb / Booking.com / VRBO iCal import → occupancy calendar in the app.

alter table public.villas
  add column if not exists ical_import_url text,
  add column if not exists ical_synced_at timestamptz;

comment on column public.villas.ical_import_url is
  'Private iCal export URL from Airbnb / Booking.com / VRBO (calendar sync)';
comment on column public.villas.ical_synced_at is
  'Last successful pull of ical_import_url into villa_calendar_bookings';

create table if not exists public.villa_calendar_bookings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  villa_id uuid not null references public.villas (id) on delete cascade,
  external_uid text not null,
  source text not null default 'ical'
    check (source in ('ical', 'airbnb', 'booking', 'vrbo', 'manual')),
  summary text,
  check_in date not null,
  check_out date not null,
  status text not null default 'booked'
    check (status in ('booked', 'blocked', 'cancelled')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (villa_id, external_uid),
  check (check_out >= check_in)
);

create index if not exists villa_calendar_bookings_villa_dates_idx
  on public.villa_calendar_bookings (villa_id, check_in, check_out);
create index if not exists villa_calendar_bookings_org_idx
  on public.villa_calendar_bookings (org_id);

alter table public.villa_calendar_bookings enable row level security;

drop policy if exists villa_calendar_bookings_select on public.villa_calendar_bookings;
create policy villa_calendar_bookings_select on public.villa_calendar_bookings
  for select using (public.in_org(org_id));

drop policy if exists villa_calendar_bookings_write on public.villa_calendar_bookings;
create policy villa_calendar_bookings_write on public.villa_calendar_bookings
  for all using (public.is_org_manager_or_owner(org_id))
  with check (public.is_org_manager_or_owner(org_id));

-- Guest stay loop: stays, house guides, support chat, deposits, photos, date requests

create table if not exists public.guest_stays (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  villa_id uuid not null references public.villas (id) on delete cascade,
  guest_profile_id uuid not null references public.profiles (id) on delete cascade,
  check_in date not null,
  check_out date not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'active', 'completed')),
  owner_notices text,
  created_at timestamptz not null default now()
);

create index if not exists guest_stays_guest_idx
  on public.guest_stays (guest_profile_id, status);
create index if not exists guest_stays_org_idx
  on public.guest_stays (org_id);

create table if not exists public.house_guides (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  villa_id uuid not null references public.villas (id) on delete cascade,
  wifi_ssid text,
  wifi_password text,
  gate_code text,
  bins_notes text,
  quiet_hours text,
  checkout_checklist text,
  extra_notes text,
  updated_at timestamptz not null default now(),
  unique (villa_id)
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  stay_id uuid not null references public.guest_stays (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_stay_idx
  on public.support_messages (stay_id, created_at);

create table if not exists public.guest_deposits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  stay_id uuid not null references public.guest_stays (id) on delete cascade,
  amount numeric(12, 2) not null,
  currency text not null default 'THB',
  status text not null default 'held'
    check (status in ('held', 'partial', 'refunded')),
  refunded_amount numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (stay_id)
);

create table if not exists public.guest_charges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  stay_id uuid not null references public.guest_stays (id) on delete cascade,
  deposit_id uuid references public.guest_deposits (id) on delete set null,
  description text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'THB',
  proof_photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.stay_photos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  stay_id uuid not null references public.guest_stays (id) on delete cascade,
  kind text not null check (kind in ('arrival', 'departure')),
  photo_url text not null,
  note text,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.stay_date_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  villa_id uuid not null references public.villas (id) on delete cascade,
  guest_profile_id uuid not null references public.profiles (id) on delete cascade,
  check_in date not null,
  check_out date not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.guest_stays enable row level security;
alter table public.house_guides enable row level security;
alter table public.support_messages enable row level security;
alter table public.guest_deposits enable row level security;
alter table public.guest_charges enable row level security;
alter table public.stay_photos enable row level security;
alter table public.stay_date_requests enable row level security;

-- Guest sees own stays; owners/managers see org stays
create policy guest_stays_select on public.guest_stays for select using (
  guest_profile_id = auth.uid()
  or public.is_org_manager_or_owner(org_id)
);
create policy guest_stays_write on public.guest_stays for all using (
  public.is_org_manager_or_owner(org_id)
) with check (public.is_org_manager_or_owner(org_id));

-- House guides: guests in org can read; owners/managers write
create policy house_guides_select on public.house_guides for select using (
  public.in_org(org_id)
);
create policy house_guides_write on public.house_guides for all using (
  public.is_org_manager_or_owner(org_id)
) with check (public.is_org_manager_or_owner(org_id));

-- Support: guest on stay or owner/manager
create policy support_messages_select on public.support_messages for select using (
  public.is_org_manager_or_owner(org_id)
  or exists (
    select 1 from public.guest_stays s
    where s.id = stay_id and s.guest_profile_id = auth.uid()
  )
);
create policy support_messages_insert on public.support_messages for insert with check (
  sender_id = auth.uid()
  and (
    public.is_org_manager_or_owner(org_id)
    or exists (
      select 1 from public.guest_stays s
      where s.id = stay_id and s.guest_profile_id = auth.uid()
    )
  )
);

create policy guest_deposits_select on public.guest_deposits for select using (
  public.is_org_manager_or_owner(org_id)
  or exists (
    select 1 from public.guest_stays s
    where s.id = stay_id and s.guest_profile_id = auth.uid()
  )
);
create policy guest_deposits_write on public.guest_deposits for all using (
  public.is_org_manager_or_owner(org_id)
) with check (public.is_org_manager_or_owner(org_id));

create policy guest_charges_select on public.guest_charges for select using (
  public.is_org_manager_or_owner(org_id)
  or exists (
    select 1 from public.guest_stays s
    where s.id = stay_id and s.guest_profile_id = auth.uid()
  )
);
create policy guest_charges_write on public.guest_charges for all using (
  public.is_org_manager_or_owner(org_id)
) with check (public.is_org_manager_or_owner(org_id));

create policy stay_photos_select on public.stay_photos for select using (
  public.is_org_manager_or_owner(org_id)
  or exists (
    select 1 from public.guest_stays s
    where s.id = stay_id and s.guest_profile_id = auth.uid()
  )
);
create policy stay_photos_insert on public.stay_photos for insert with check (
  uploaded_by = auth.uid()
  and (
    public.is_org_manager_or_owner(org_id)
    or exists (
      select 1 from public.guest_stays s
      where s.id = stay_id and s.guest_profile_id = auth.uid()
    )
  )
);

create policy stay_date_requests_select on public.stay_date_requests for select using (
  guest_profile_id = auth.uid()
  or public.is_org_manager_or_owner(org_id)
);
create policy stay_date_requests_insert on public.stay_date_requests for insert with check (
  guest_profile_id = auth.uid()
  and public.in_org(org_id)
);
create policy stay_date_requests_update on public.stay_date_requests for update using (
  public.is_org_manager_or_owner(org_id)
);

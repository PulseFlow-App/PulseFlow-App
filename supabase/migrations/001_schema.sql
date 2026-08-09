-- PulseFlow schema + RLS (multi-tenant ready)

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  role text not null check (role in ('owner', 'employee')),
  full_name text not null,
  phone text
);

create table if not exists public.villas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  area text,
  status text not null check (status in ('available', 'occupied', 'turnover', 'maintenance')),
  check_in date,
  check_out date,
  cleaning_status text not null default 'not_needed'
    check (cleaning_status in ('not_needed', 'in_progress', 'done')),
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  role text not null,
  phone text,
  messenger text not null default 'none' check (messenger in ('whatsapp', 'line', 'none')),
  messenger_handle text,
  notes text
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  villa_id uuid references public.villas (id) on delete set null,
  title text not null,
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  assigned_to uuid references public.profiles (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'done')),
  due_date date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  villa_id uuid references public.villas (id) on delete set null,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'THB',
  status text not null default 'pending' check (status in ('pending', 'paid')),
  submitted_by uuid not null references public.profiles (id),
  receipt_photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_org on public.profiles (org_id);
create index if not exists idx_villas_org on public.villas (org_id);
create index if not exists idx_contacts_org on public.contacts (org_id);
create index if not exists idx_tasks_org on public.tasks (org_id);
create index if not exists idx_bills_org on public.bills (org_id);
create index if not exists idx_messages_org on public.messages (org_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists villas_set_updated_at on public.villas;
create trigger villas_set_updated_at
before update on public.villas
for each row execute function public.set_updated_at();

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.villas enable row level security;
alter table public.contacts enable row level security;
alter table public.tasks enable row level security;
alter table public.bills enable row level security;
alter table public.messages enable row level security;

create policy "org members read org"
  on public.organizations for select
  using (id = public.current_org_id());

create policy "profiles read same org"
  on public.profiles for select
  using (org_id = public.current_org_id());

create policy "profiles update self"
  on public.profiles for update
  using (id = auth.uid());

create policy "villas select org"
  on public.villas for select using (org_id = public.current_org_id());
create policy "villas insert org"
  on public.villas for insert with check (
    org_id = public.current_org_id() and public.current_role() = 'owner'
  );
create policy "villas update org"
  on public.villas for update using (org_id = public.current_org_id());
create policy "villas delete owner"
  on public.villas for delete using (
    org_id = public.current_org_id() and public.current_role() = 'owner'
  );

create policy "contacts select org"
  on public.contacts for select using (org_id = public.current_org_id());
create policy "contacts write owner"
  on public.contacts for all using (
    org_id = public.current_org_id() and public.current_role() = 'owner'
  )
  with check (
    org_id = public.current_org_id() and public.current_role() = 'owner'
  );

create policy "tasks select org"
  on public.tasks for select using (org_id = public.current_org_id());
create policy "tasks insert org"
  on public.tasks for insert with check (org_id = public.current_org_id());
create policy "tasks update org"
  on public.tasks for update using (org_id = public.current_org_id());
create policy "tasks delete org"
  on public.tasks for delete using (org_id = public.current_org_id());

create policy "bills select org"
  on public.bills for select using (org_id = public.current_org_id());
create policy "bills insert org"
  on public.bills for insert with check (org_id = public.current_org_id());
create policy "bills update owner"
  on public.bills for update using (
    org_id = public.current_org_id() and public.current_role() = 'owner'
  );
create policy "bills delete owner"
  on public.bills for delete using (
    org_id = public.current_org_id() and public.current_role() = 'owner'
  );

create policy "messages select org"
  on public.messages for select using (org_id = public.current_org_id());
create policy "messages insert org"
  on public.messages for insert with check (
    org_id = public.current_org_id() and sender_id = auth.uid()
  );

-- Storage bucket for receipt photos
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "receipts read authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts');

create policy "receipts upload authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

-- Realtime
alter publication supabase_realtime add table public.villas;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.bills;
alter publication supabase_realtime add table public.messages;

-- Guesty company integration: encrypted OAuth credentials + listing link on villas.

create table if not exists public.org_integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('guesty')),
  client_id_cipher text not null,
  client_secret_cipher text not null,
  status text not null default 'connected'
    check (status in ('connected', 'error', 'disconnected')),
  last_error text,
  last_sync_at timestamptz,
  listings_synced integer not null default 0,
  connected_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider)
);

comment on table public.org_integrations is
  'Server-only integration secrets (ciphertext). Access via service role / API routes.';

create index if not exists org_integrations_org_idx
  on public.org_integrations (org_id);

alter table public.org_integrations enable row level security;

-- No client policies: only service role (API) reads/writes secrets.
drop policy if exists org_integrations_deny_all on public.org_integrations;
create policy org_integrations_deny_all on public.org_integrations
  for all using (false) with check (false);

alter table public.villas
  add column if not exists guesty_listing_id text;

comment on column public.villas.guesty_listing_id is
  'Guesty listing _id when this property was imported/synced from Guesty';

create unique index if not exists villas_org_guesty_listing_uidx
  on public.villas (org_id, guesty_listing_id)
  where guesty_listing_id is not null;

alter table public.villas
  add column if not exists location_url text,
  add column if not exists description text;

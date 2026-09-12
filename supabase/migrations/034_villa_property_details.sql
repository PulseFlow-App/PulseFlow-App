-- Optional listing facts for property cards (size, rooms, amenities).

alter table public.villas
  add column if not exists sq_m numeric(8,1),
  add column if not exists bedrooms numeric(4,1),
  add column if not exists bathrooms numeric(4,1),
  add column if not exists max_guests smallint,
  add column if not exists floors smallint,
  add column if not exists has_pool boolean,
  add column if not exists has_garden boolean,
  add column if not exists pet_friendly boolean,
  add column if not exists has_wifi boolean,
  add column if not exists setting text,
  add column if not exists parking text,
  add column if not exists kitchen text,
  add column if not exists aircon text,
  add column if not exists view text;

alter table public.villas
  drop constraint if exists villas_setting_check;
alter table public.villas
  add constraint villas_setting_check
  check (setting is null or setting in ('community', 'standalone'));

alter table public.villas
  drop constraint if exists villas_parking_check;
alter table public.villas
  add constraint villas_parking_check
  check (parking is null or parking in ('none', 'street', 'private'));

alter table public.villas
  drop constraint if exists villas_kitchen_check;
alter table public.villas
  add constraint villas_kitchen_check
  check (kitchen is null or kitchen in ('none', 'basic', 'full'));

alter table public.villas
  drop constraint if exists villas_aircon_check;
alter table public.villas
  add constraint villas_aircon_check
  check (aircon is null or aircon in ('none', 'partial', 'full'));

alter table public.villas
  drop constraint if exists villas_view_check;
alter table public.villas
  add constraint villas_view_check
  check (view is null or view in ('sea', 'jungle', 'pool', 'garden', 'mountain'));

alter table public.villas
  drop constraint if exists villas_sq_m_check;
alter table public.villas
  add constraint villas_sq_m_check
  check (sq_m is null or sq_m >= 0);

alter table public.villas
  drop constraint if exists villas_bedrooms_check;
alter table public.villas
  add constraint villas_bedrooms_check
  check (bedrooms is null or bedrooms >= 0);

alter table public.villas
  drop constraint if exists villas_bathrooms_check;
alter table public.villas
  add constraint villas_bathrooms_check
  check (bathrooms is null or bathrooms >= 0);

alter table public.villas
  drop constraint if exists villas_max_guests_check;
alter table public.villas
  add constraint villas_max_guests_check
  check (max_guests is null or max_guests >= 0);

alter table public.villas
  drop constraint if exists villas_floors_check;
alter table public.villas
  add constraint villas_floors_check
  check (floors is null or floors >= 0);

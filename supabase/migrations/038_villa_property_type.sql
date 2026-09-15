-- Property type for listing cards (villa, office, studio, …).

alter table public.villas
  add column if not exists property_type text;

alter table public.villas
  drop constraint if exists villas_property_type_check;
alter table public.villas
  add constraint villas_property_type_check
  check (
    property_type is null
    or property_type in (
      'villa',
      'bungalow',
      'house',
      'apartment',
      'studio',
      'office',
      'other'
    )
  );

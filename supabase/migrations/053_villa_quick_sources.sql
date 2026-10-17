-- Optional quick ways to attach property facts when creating/editing a villa.
-- Listing / Drive links, uploaded PDF-sheet, and pasted listing text.

alter table public.villas
  add column if not exists listing_url text,
  add column if not exists drive_url text,
  add column if not exists info_doc_url text,
  add column if not exists info_doc_name text,
  add column if not exists source_notes text;

comment on column public.villas.listing_url is
  'Airbnb / Booking.com / VRBO / other aggregator listing URL';
comment on column public.villas.drive_url is
  'Google Drive / Dropbox / folder with photos or docs';
comment on column public.villas.info_doc_url is
  'Uploaded PDF, sheet, or doc with property info';
comment on column public.villas.source_notes is
  'Pasted listing text or freeform notes from WhatsApp / email';

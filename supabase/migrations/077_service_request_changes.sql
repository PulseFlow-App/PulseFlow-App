-- A quote can carry a note. Either person can change the job or cancel it, with a reason.
-- Apply this in the Supabase SQL editor. The app does not apply it.

alter table public.service_requests
  add column if not exists quote_note text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid,
  add column if not exists cancel_reason text;

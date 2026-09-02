-- Pending guest profile merges when an existing email accepts another company invite.
-- Merge only completes after the user opens the email link and confirms with password.

create table if not exists public.profile_merge_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  invite_id uuid not null references public.invites (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  role text not null
    check (role in ('manager', 'cleaner', 'staff', 'guest')),
  email text not null,
  full_name text,
  phone text,
  job_title text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  confirmed_at timestamptz
);

create unique index if not exists profile_merge_requests_invite_pending_idx
  on public.profile_merge_requests (invite_id)
  where status = 'pending';

create index if not exists profile_merge_requests_token_idx
  on public.profile_merge_requests (token);

alter table public.profile_merge_requests enable row level security;

-- No direct client access; server uses service role.
drop policy if exists profile_merge_requests_none on public.profile_merge_requests;
create policy profile_merge_requests_none on public.profile_merge_requests
  for all using (false);

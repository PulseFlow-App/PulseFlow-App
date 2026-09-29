-- Personal access tokens for Pulse MCP (hashed; plaintext shown once at create).

create table if not exists public.mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  label text not null default 'Cursor',
  token_prefix text not null,
  token_hash text not null unique,
  scopes text[] not null default array['me:read', 'tasks:read', 'tasks:write', 'jobs:read']::text[],
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists mcp_tokens_profile_idx
  on public.mcp_tokens (profile_id)
  where revoked_at is null;

create index if not exists mcp_tokens_hash_idx
  on public.mcp_tokens (token_hash)
  where revoked_at is null;

comment on table public.mcp_tokens is
  'Hashed personal tokens for MCP / API agent access. Never store plaintext.';

alter table public.mcp_tokens enable row level security;

-- Users manage only their own tokens via the app (session). MCP routes use service role after hash lookup.
drop policy if exists mcp_tokens_select_own on public.mcp_tokens;
create policy mcp_tokens_select_own
  on public.mcp_tokens for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists mcp_tokens_insert_own on public.mcp_tokens;
create policy mcp_tokens_insert_own
  on public.mcp_tokens for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists mcp_tokens_update_own on public.mcp_tokens;
create policy mcp_tokens_update_own
  on public.mcp_tokens for update to authenticated
  using (profile_id = auth.uid());

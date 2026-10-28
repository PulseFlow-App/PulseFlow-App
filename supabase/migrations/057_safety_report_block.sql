-- Apple 1.2 / Play UGC: report content and block users in chat / support.

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_blocks_no_self check (blocker_id <> blocked_id),
  constraint user_blocks_unique unique (blocker_id, blocked_id)
);

create index if not exists idx_user_blocks_blocker on public.user_blocks (blocker_id);
create index if not exists idx_user_blocks_blocked on public.user_blocks (blocked_id);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  message_id uuid,
  channel text,
  reason text not null default 'abuse',
  details text,
  created_at timestamptz not null default now()
);

create index if not exists idx_content_reports_org on public.content_reports (org_id, created_at desc);

alter table public.user_blocks enable row level security;
alter table public.content_reports enable row level security;

create policy "user_blocks_select_own"
  on public.user_blocks for select
  using (blocker_id = auth.uid());

create policy "user_blocks_insert_own"
  on public.user_blocks for insert
  with check (
    blocker_id = auth.uid()
    and org_id in (select org_id from public.profiles where id = auth.uid())
  );

create policy "user_blocks_delete_own"
  on public.user_blocks for delete
  using (blocker_id = auth.uid());

create policy "content_reports_insert_own"
  on public.content_reports for insert
  with check (
    reporter_id = auth.uid()
    and org_id in (select org_id from public.profiles where id = auth.uid())
  );

create policy "content_reports_select_own"
  on public.content_reports for select
  using (reporter_id = auth.uid());

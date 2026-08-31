-- Guest briefings: host-sent checklist items guests confirm as read.
-- Also allow guest_update notification kind for push + in-app.

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check check (
    kind in (
      'check_in',
      'check_out',
      'urgent_task',
      'task_assigned',
      'task_completed',
      'message',
      'bill_due',
      'bill_submitted',
      'bill_paid',
      'appointment',
      'team_joined',
      'endorsement',
      'guest_update'
    )
  );

create table if not exists public.guest_briefings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  stay_id uuid not null references public.guest_stays (id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'custom'
    check (category in ('check_in', 'keys', 'emergency', 'app_help', 'house', 'custom')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles (id) on delete set null
);

create index if not exists guest_briefings_stay_idx
  on public.guest_briefings (stay_id, created_at);

alter table public.guest_briefings enable row level security;

drop policy if exists guest_briefings_select on public.guest_briefings;
create policy guest_briefings_select on public.guest_briefings for select using (
  public.is_org_manager_or_owner(org_id)
  or exists (
    select 1 from public.guest_stays s
    where s.id = stay_id and s.guest_profile_id = auth.uid()
  )
);

drop policy if exists guest_briefings_insert on public.guest_briefings;
create policy guest_briefings_insert on public.guest_briefings for insert with check (
  public.is_org_manager_or_owner(org_id)
  and created_by = auth.uid()
);

drop policy if exists guest_briefings_update on public.guest_briefings;
create policy guest_briefings_update on public.guest_briefings for update using (
  public.is_org_manager_or_owner(org_id)
  or exists (
    select 1 from public.guest_stays s
    where s.id = stay_id and s.guest_profile_id = auth.uid()
  )
);

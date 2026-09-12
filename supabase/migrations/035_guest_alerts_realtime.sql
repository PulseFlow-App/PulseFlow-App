-- Guest briefings + support chat: lock-screen push and live inbox
-- 1) Guests can read notifications targeted at them (not only current_org_id()).
-- 2) guest_update stays a valid notification kind.
-- 3) Realtime publishes support_messages and guest_briefings so the guest app
--    refreshes when a host sends a briefing or support message.

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

drop policy if exists "notifications select org" on public.notifications;
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (
    public.in_org(org_id)
    and (
      audience_profile_ids is null
      or auth.uid() = any (audience_profile_ids)
    )
  );

drop policy if exists "notifications update org" on public.notifications;
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update using (
    public.in_org(org_id)
    and (
      audience_profile_ids is null
      or auth.uid() = any (audience_profile_ids)
    )
  );

drop function if exists public.mark_my_notifications_read(text);
create or replace function public.mark_my_notifications_read(p_kind text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  updated_count integer := 0;
begin
  if uid is null then
    return 0;
  end if;

  update public.notifications n
  set read_by = case
    when n.read_by is null then array[uid]
    when uid = any(n.read_by) then n.read_by
    else n.read_by || uid
  end
  where public.in_org(n.org_id)
    and (n.audience_profile_ids is null or uid = any(n.audience_profile_ids))
    and (n.read_by is null or not (uid = any(n.read_by)))
    and (p_kind is null or n.kind = p_kind);

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function public.mark_my_notifications_read(text) to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.support_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.guest_briefings;
  exception when duplicate_object then null;
  end;
end $$;

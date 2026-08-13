-- Mark visible unread as read for the current user (badge / inbox clear).
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
  where n.org_id = public.current_org_id()
    and (n.audience_profile_ids is null or uid = any(n.audience_profile_ids))
    and (n.read_by is null or not (uid = any(n.read_by)))
    and (p_kind is null or n.kind = p_kind);

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function public.mark_my_notifications_read(text) to authenticated;

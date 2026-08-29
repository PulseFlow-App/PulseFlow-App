-- Extra in-app notification kinds

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
      'endorsement'
    )
  );

-- Bill categories for owner spend analytics
alter table public.bills
  add column if not exists category text not null default 'other';

alter table public.bills drop constraint if exists bills_category_check;
alter table public.bills
  add constraint bills_category_check check (
    category in (
      'cleaning',
      'maintenance',
      'utilities',
      'supplies',
      'transport',
      'pool',
      'garden',
      'staff',
      'other'
    )
  );

create index if not exists idx_bills_org_category on public.bills (org_id, category);
create index if not exists idx_bills_org_created on public.bills (org_id, created_at desc);

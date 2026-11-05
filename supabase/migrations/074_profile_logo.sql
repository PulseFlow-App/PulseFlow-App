-- Optional logo chosen on the registration form.

alter table public.profiles
  add column if not exists logo_url text;

comment on column public.profiles.logo_url is
  'Optional account logo. Set at registration. Public URL or empty.';

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists logos_read on storage.objects;
create policy logos_read on storage.objects
  for select using (bucket_id = 'logos');

-- Backfill missing public profile slugs for non-owner team members.
-- Uses full_name; app-layer ensureProfileShareSlug handles collisions on login.

update public.profiles p
set share_slug = sub.slug
from (
  select
    id,
    trim(both '-' from lower(regexp_replace(
      coalesce(nullif(trim(full_name), ''), 'member'),
      '[^a-z0-9]+',
      '-',
      'g'
    ))) as slug
  from public.profiles
  where share_slug is null
    and role <> 'owner'
) sub
where p.id = sub.id
  and sub.slug <> ''
  and not exists (
    select 1 from public.profiles x where x.share_slug = sub.slug and x.id <> p.id
  );

-- Resolve remaining collisions with profile id suffix.
update public.profiles p
set share_slug = left(
  trim(both '-' from lower(regexp_replace(
    coalesce(nullif(trim(full_name), ''), 'member'),
    '[^a-z0-9]+',
    '-',
    'g'
  ))),
  24
) || '-' || left(replace(id::text, '-', ''), 6)
where share_slug is null
  and role <> 'owner';

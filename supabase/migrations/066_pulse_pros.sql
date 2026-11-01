-- Pulse Flow Services. Additive. Does not alter contacts, tasks, or bills.
-- Supersedes the unpublished services marketplace draft.

create or replace function public.is_pro_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pro_admins where profile_id = auth.uid()
  );
$$;

create table if not exists public.pro_admins (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.pro_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  icon text not null default 'wrench',
  sort int not null default 0,
  active boolean not null default true,
  parent_id uuid references public.pro_categories (id) on delete set null
);

create table if not exists public.pro_category_translations (
  category_id uuid not null references public.pro_categories (id) on delete cascade,
  locale text not null,
  name text not null,
  description text not null default '',
  primary key (category_id, locale)
);

create table if not exists public.pro_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  country_code text not null check (char_length(country_code) = 2),
  parent_id uuid references public.pro_areas (id) on delete cascade,
  level text not null check (level in ('country', 'region', 'locality', 'district')),
  lat double precision,
  lng double precision,
  demo_market boolean not null default false
);

create table if not exists public.pro_area_translations (
  area_id uuid not null references public.pro_areas (id) on delete cascade,
  locale text not null,
  name text not null,
  primary key (area_id, locale)
);

create table if not exists public.pro_profiles (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts (id) on delete set null,
  org_id uuid references public.organizations (id) on delete cascade,
  display_name text not null,
  description text not null default '',
  description_locale text not null default 'en',
  photo_url text,
  photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) <= 3),
  languages text[] not null default '{}',
  phone text,
  line_id text,
  whatsapp text,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  available boolean not null default true,
  consent_at timestamptz,
  consent_by uuid references public.profiles (id) on delete set null,
  consent_note text,
  claim_token uuid unique default gen_random_uuid(),
  claimed_at timestamptz,
  claimed_by uuid references public.profiles (id) on delete set null,
  listing_tier text not null default 'free',
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  identity_checked_at timestamptz,
  business_checked_at timestamptz,
  qualification_checked_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pro_profile_categories (
  profile_id uuid not null references public.pro_profiles (id) on delete cascade,
  category_id uuid not null references public.pro_categories (id) on delete cascade,
  primary key (profile_id, category_id)
);

create table if not exists public.pro_profile_areas (
  profile_id uuid not null references public.pro_profiles (id) on delete cascade,
  area_id uuid not null references public.pro_areas (id) on delete cascade,
  primary key (profile_id, area_id)
);

create table if not exists public.pro_requests (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  org_id uuid references public.organizations (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  villa_id uuid references public.villas (id) on delete set null,
  category_id uuid not null references public.pro_categories (id),
  title text not null,
  description text not null,
  original_locale text not null default 'en',
  translations jsonb not null default '{}'::jsonb,
  photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array'),
  area_id uuid references public.pro_areas (id),
  urgency text not null default 'flexible' check (urgency in ('today', 'this_week', 'flexible')),
  preferred_time text,
  language text,
  source text not null default 'open' check (source in ('direct', 'open')),
  invited_profile_id uuid references public.pro_profiles (id) on delete set null,
  final_amount numeric(12,2) check (final_amount is null or final_amount >= 0),
  final_currency text,
  paid_at timestamptz,
  status text not null default 'requested' check (status in (
    'requested', 'offers_received', 'chosen', 'scheduled',
    'in_progress', 'awaiting_approval', 'completed', 'cancelled'
  )),
  chosen_profile_id uuid references public.pro_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pro_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.pro_requests (id) on delete cascade,
  profile_id uuid not null references public.pro_profiles (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  amount numeric(12,2) check (amount is null or amount >= 0),
  currency text,
  message text not null default '',
  original_locale text not null default 'en',
  translations jsonb not null default '{}'::jsonb,
  proposed_time text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (request_id, profile_id)
);

create table if not exists public.pro_jobs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.pro_profiles (id) on delete cascade,
  request_id uuid references public.pro_requests (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  category_id uuid references public.pro_categories (id) on delete set null,
  completed_at timestamptz not null default now()
);

create unique index if not exists pro_jobs_request_uidx
  on public.pro_jobs (request_id) where request_id is not null;
create unique index if not exists pro_jobs_task_uidx
  on public.pro_jobs (task_id) where task_id is not null;

create table if not exists public.pro_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.pro_profiles (id) on delete cascade,
  request_id uuid references public.pro_requests (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text not null default '',
  original_locale text not null default 'en',
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists pro_reviews_request_uidx
  on public.pro_reviews (request_id) where request_id is not null;

create table if not exists public.pro_reports (
  id uuid primary key default gen_random_uuid(),
  target text not null check (target in ('profile', 'review')),
  target_id uuid not null,
  reason text not null,
  reported_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pro_favourites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  profile_id uuid not null references public.pro_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);

create table if not exists public.pro_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  ref text,
  created_at timestamptz not null default now()
);

create or replace view public.pro_directory as
select
  p.id,
  p.display_name,
  p.description,
  p.description_locale,
  p.photo_url,
  p.photos,
  p.languages,
  p.visibility,
  p.available,
  p.email_verified_at,
  p.phone_verified_at,
  p.identity_checked_at,
  p.business_checked_at,
  p.qualification_checked_at,
  p.created_at
from public.pro_profiles p
where p.visibility = 'public' and p.status = 'active';

-- Reply from a message link. The token is the credential.
create or replace function public.submit_pro_reply(
  p_token uuid,
  p_action text,
  p_amount numeric,
  p_currency text,
  p_message text,
  p_proposed_time text,
  p_locale text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  offer public.pro_offers%rowtype;
begin
  if p_action not in ('quote', 'decline', 'time') then
    raise exception 'unsupported action';
  end if;
  select * into offer from public.pro_offers where token = p_token;
  if offer.id is null then
    raise exception 'unknown token';
  end if;
  if offer.status <> 'pending' then
    return offer.id;
  end if;
  if p_action = 'decline' then
    update public.pro_offers set status = 'declined' where id = offer.id;
  else
    update public.pro_offers
      set amount = p_amount,
          currency = nullif(p_currency, ''),
          message = coalesce(p_message, ''),
          original_locale = coalesce(nullif(p_locale, ''), original_locale),
          proposed_time = nullif(p_proposed_time, '')
      where id = offer.id;
  end if;
  update public.pro_requests
    set status = 'offers_received'
    where id = offer.request_id and status = 'requested';
  insert into public.pro_events (name, ref)
  values ('offer_sent', offer.id::text);
  return offer.id;
end;
$$;

revoke all on function public.submit_pro_reply(uuid, text, numeric, text, text, text, text) from public;
grant execute on function public.submit_pro_reply(uuid, text, numeric, text, text, text, text) to anon, authenticated;

alter table public.pro_admins enable row level security;
alter table public.pro_categories enable row level security;
alter table public.pro_category_translations enable row level security;
alter table public.pro_areas enable row level security;
alter table public.pro_area_translations enable row level security;
alter table public.pro_profiles enable row level security;
alter table public.pro_profile_categories enable row level security;
alter table public.pro_profile_areas enable row level security;
alter table public.pro_requests enable row level security;
alter table public.pro_offers enable row level security;
alter table public.pro_jobs enable row level security;
alter table public.pro_reviews enable row level security;
alter table public.pro_reports enable row level security;
alter table public.pro_favourites enable row level security;
alter table public.pro_events enable row level security;

create policy "pros catalog read" on public.pro_categories for select using (true);
create policy "pros catalog write" on public.pro_categories for all
  using (public.is_pro_admin()) with check (public.is_pro_admin());
create policy "pros category i18n read" on public.pro_category_translations for select using (true);
create policy "pros category i18n write" on public.pro_category_translations for all
  using (public.is_pro_admin()) with check (public.is_pro_admin());
create policy "pros areas read" on public.pro_areas for select using (true);
create policy "pros areas write" on public.pro_areas for all
  using (public.is_pro_admin()) with check (public.is_pro_admin());
create policy "pros area i18n read" on public.pro_area_translations for select using (true);
create policy "pros area i18n write" on public.pro_area_translations for all
  using (public.is_pro_admin()) with check (public.is_pro_admin());

create policy "pros profile read" on public.pro_profiles for select using (
  (visibility = 'public' and status = 'active')
  or org_id = public.current_org_id()
  or created_by = auth.uid()
  or public.is_pro_admin()
);
create policy "pros profile insert" on public.pro_profiles for insert with check (
  consent_at is not null
  and org_id = public.current_org_id()
  and public.current_role() in ('owner', 'manager')
);
create policy "pros profile update" on public.pro_profiles for update using (
  public.is_pro_admin()
  or (org_id = public.current_org_id() and public.current_role() in ('owner', 'manager'))
);
create policy "pros profile delete" on public.pro_profiles for delete using (
  public.is_pro_admin()
  or (org_id = public.current_org_id() and public.current_role() in ('owner', 'manager'))
);

create policy "pros profile cats read" on public.pro_profile_categories for select using (true);
create policy "pros profile cats write" on public.pro_profile_categories for all
  using (
    public.is_pro_admin() or exists (
      select 1 from public.pro_profiles p
      where p.id = profile_id and p.org_id = public.current_org_id()
    )
  )
  with check (
    public.is_pro_admin() or exists (
      select 1 from public.pro_profiles p
      where p.id = profile_id and p.org_id = public.current_org_id()
    )
  );
create policy "pros profile areas read" on public.pro_profile_areas for select using (true);
create policy "pros profile areas write" on public.pro_profile_areas for all
  using (
    public.is_pro_admin() or exists (
      select 1 from public.pro_profiles p
      where p.id = profile_id and p.org_id = public.current_org_id()
    )
  )
  with check (
    public.is_pro_admin() or exists (
      select 1 from public.pro_profiles p
      where p.id = profile_id and p.org_id = public.current_org_id()
    )
  );

create policy "pros request read" on public.pro_requests for select using (
  created_by = auth.uid() or org_id = public.current_org_id() or public.is_pro_admin()
);
create policy "pros request insert" on public.pro_requests for insert with check (
  created_by = auth.uid()
);
create policy "pros request update" on public.pro_requests for update using (
  created_by = auth.uid() or public.is_pro_admin()
);

create policy "pros offer read" on public.pro_offers for select using (
  public.is_pro_admin() or exists (
    select 1 from public.pro_requests r
    where r.id = request_id and (r.created_by = auth.uid() or r.org_id = public.current_org_id())
  )
);
create policy "pros offer insert" on public.pro_offers for insert with check (
  exists (
    select 1 from public.pro_requests r
    where r.id = request_id and r.created_by = auth.uid()
  )
);

create policy "pros jobs read" on public.pro_jobs for select using (true);
create policy "pros reviews read" on public.pro_reviews for select using (true);
create policy "pros reviews insert" on public.pro_reviews for insert with check (author_id = auth.uid());
create policy "pros reports insert" on public.pro_reports for insert with check (reported_by = auth.uid());
create policy "pros reports admin" on public.pro_reports for select using (public.is_pro_admin());
create policy "pros favourite own" on public.pro_favourites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pros events insert" on public.pro_events for insert with check (true);
create policy "pros events admin" on public.pro_events for select using (public.is_pro_admin());
create policy "pros admins self" on public.pro_admins for select using (
  profile_id = auth.uid() or public.is_pro_admin()
);

grant select on public.pro_directory to anon, authenticated;

-- Seed taxonomy and demonstration geography. No professionals, reviews, or jobs.
insert into public.pro_categories (id, slug, icon, sort) values
  ('c2000001-0000-4000-8000-000000000001', 'hvac', 'wind', 1),
  ('c2000001-0000-4000-8000-000000000002', 'plumbing', 'droplets', 2),
  ('c2000001-0000-4000-8000-000000000003', 'electrical', 'zap', 3),
  ('c2000001-0000-4000-8000-000000000004', 'handyman', 'wrench', 4),
  ('c2000001-0000-4000-8000-000000000005', 'cleaning', 'sparkles', 5),
  ('c2000001-0000-4000-8000-000000000006', 'deep-cleaning', 'sparkles', 6),
  ('c2000001-0000-4000-8000-000000000007', 'pool', 'waves', 7),
  ('c2000001-0000-4000-8000-000000000008', 'gardening', 'trees', 8),
  ('c2000001-0000-4000-8000-000000000009', 'painting', 'paintbrush', 9),
  ('c2000001-0000-4000-8000-000000000010', 'carpentry', 'hammer', 10),
  ('c2000001-0000-4000-8000-000000000011', 'construction', 'hard-hat', 11),
  ('c2000001-0000-4000-8000-000000000012', 'appliance', 'refrigerator', 12),
  ('c2000001-0000-4000-8000-000000000013', 'pest', 'bug', 13),
  ('c2000001-0000-4000-8000-000000000014', 'water', 'glass-water', 14),
  ('c2000001-0000-4000-8000-000000000015', 'it', 'wifi', 15),
  ('c2000001-0000-4000-8000-000000000016', 'locksmith', 'key', 16),
  ('c2000001-0000-4000-8000-000000000017', 'waste', 'trash', 17),
  ('c2000001-0000-4000-8000-000000000018', 'moving', 'truck', 18),
  ('c2000001-0000-4000-8000-000000000019', 'other', 'more', 19)
on conflict (id) do nothing;

insert into public.pro_category_translations (category_id, locale, name, description) values
  ('c2000001-0000-4000-8000-000000000001', 'en', 'Air conditioning and HVAC', 'Cooling, servicing, and repair'),
  ('c2000001-0000-4000-8000-000000000001', 'th', 'แอร์และระบบปรับอากาศ', 'ติดตั้ง ล้าง และซ่อม'),
  ('c2000001-0000-4000-8000-000000000001', 'ru', 'Кондиционеры и HVAC', 'Обслуживание и ремонт'),
  ('c2000001-0000-4000-8000-000000000001', 'he', 'מיזוג אוויר', 'התקנה, טיפול ותיקון'),
  ('c2000001-0000-4000-8000-000000000002', 'en', 'Plumbing', 'Leaks, pipes, and fixtures'),
  ('c2000001-0000-4000-8000-000000000002', 'th', 'ประปา', 'รั่ว ท่อ และอุปกรณ์'),
  ('c2000001-0000-4000-8000-000000000002', 'ru', 'Сантехника', 'Протечки, трубы, смесители'),
  ('c2000001-0000-4000-8000-000000000002', 'he', 'אינסטלציה', 'נזילות, צנרת וכלים'),
  ('c2000001-0000-4000-8000-000000000003', 'en', 'Electrical', 'Power, lights, and safety'),
  ('c2000001-0000-4000-8000-000000000003', 'th', 'ไฟฟ้า', 'ไฟ ปลั๊ก และความปลอดภัย'),
  ('c2000001-0000-4000-8000-000000000003', 'ru', 'Электрика', 'Свет, розетки, безопасность'),
  ('c2000001-0000-4000-8000-000000000003', 'he', 'חשמל', 'תאורה, שקעים ובטיחות'),
  ('c2000001-0000-4000-8000-000000000004', 'en', 'Handyman', 'Small fixes around the property'),
  ('c2000001-0000-4000-8000-000000000004', 'th', 'ช่างทั่วไป', 'งานซ่อมเล็กน้อย'),
  ('c2000001-0000-4000-8000-000000000004', 'ru', 'Мастер на час', 'Мелкий ремонт'),
  ('c2000001-0000-4000-8000-000000000004', 'he', 'הנדימן', 'תיקונים קטנים'),
  ('c2000001-0000-4000-8000-000000000005', 'en', 'Cleaning', 'Regular cleaning'),
  ('c2000001-0000-4000-8000-000000000005', 'th', 'ทำความสะอาด', 'ทำความสะอาดตามรอบ'),
  ('c2000001-0000-4000-8000-000000000005', 'ru', 'Уборка', 'Регулярная уборка'),
  ('c2000001-0000-4000-8000-000000000005', 'he', 'ניקיון', 'ניקיון שוטף'),
  ('c2000001-0000-4000-8000-000000000006', 'en', 'Deep cleaning', 'A full clean, not a quick tidy'),
  ('c2000001-0000-4000-8000-000000000006', 'th', 'ทำความสะอาดลึก', 'ทำความสะอาดทั้งหลัง'),
  ('c2000001-0000-4000-8000-000000000006', 'ru', 'Генеральная уборка', 'Полная уборка'),
  ('c2000001-0000-4000-8000-000000000006', 'he', 'ניקיון יסודי', 'ניקיון מלא'),
  ('c2000001-0000-4000-8000-000000000007', 'en', 'Pool', 'Pool care and equipment'),
  ('c2000001-0000-4000-8000-000000000007', 'th', 'สระว่ายน้ำ', 'ดูแลสระและอุปกรณ์'),
  ('c2000001-0000-4000-8000-000000000007', 'ru', 'Бассейн', 'Уход и оборудование'),
  ('c2000001-0000-4000-8000-000000000007', 'he', 'בריכה', 'טיפול בבריכה'),
  ('c2000001-0000-4000-8000-000000000008', 'en', 'Gardening', 'Garden and grounds'),
  ('c2000001-0000-4000-8000-000000000008', 'th', 'สวน', 'ดูแลสวนและสนาม'),
  ('c2000001-0000-4000-8000-000000000008', 'ru', 'Сад', 'Участок и растения'),
  ('c2000001-0000-4000-8000-000000000008', 'he', 'גינון', 'גינה ושטח'),
  ('c2000001-0000-4000-8000-000000000009', 'en', 'Painting', 'Interior and exterior paint'),
  ('c2000001-0000-4000-8000-000000000009', 'th', 'ทาสี', 'ภายในและภายนอก'),
  ('c2000001-0000-4000-8000-000000000009', 'ru', 'Покраска', 'Внутри и снаружи'),
  ('c2000001-0000-4000-8000-000000000009', 'he', 'צביעה', 'פנים וחוץ'),
  ('c2000001-0000-4000-8000-000000000010', 'en', 'Carpentry', 'Woodwork and doors'),
  ('c2000001-0000-4000-8000-000000000010', 'th', 'ช่างไม้', 'งานไม้และประตู'),
  ('c2000001-0000-4000-8000-000000000010', 'ru', 'Столярка', 'Дерево и двери'),
  ('c2000001-0000-4000-8000-000000000010', 'he', 'נגרות', 'עץ ודלתות'),
  ('c2000001-0000-4000-8000-000000000011', 'en', 'Construction and renovation', 'Building and refit work'),
  ('c2000001-0000-4000-8000-000000000011', 'th', 'ก่อสร้างและรีโนเวท', 'งานสร้างและปรับปรุง'),
  ('c2000001-0000-4000-8000-000000000011', 'ru', 'Строительство и ремонт', 'Стройка и переделка'),
  ('c2000001-0000-4000-8000-000000000011', 'he', 'בנייה ושיפוץ', 'בנייה ושיפוץ'),
  ('c2000001-0000-4000-8000-000000000012', 'en', 'Appliance repair', 'Home appliances'),
  ('c2000001-0000-4000-8000-000000000012', 'th', 'ซ่อมเครื่องใช้ไฟฟ้า', 'เครื่องใช้ในบ้าน'),
  ('c2000001-0000-4000-8000-000000000012', 'ru', 'Ремонт техники', 'Бытовая техника'),
  ('c2000001-0000-4000-8000-000000000012', 'he', 'תיקון מכשירי חשמל', 'מכשירי בית'),
  ('c2000001-0000-4000-8000-000000000013', 'en', 'Pest control', 'Insects and rodents'),
  ('c2000001-0000-4000-8000-000000000013', 'th', 'กำจัดแมลง', 'แมลงและหนู'),
  ('c2000001-0000-4000-8000-000000000013', 'ru', 'Дезинсекция', 'Насекомые и грызуны'),
  ('c2000001-0000-4000-8000-000000000013', 'he', 'הדברה', 'חרקים ומכרסמים'),
  ('c2000001-0000-4000-8000-000000000014', 'en', 'Water systems', 'Pumps, tanks, and filters'),
  ('c2000001-0000-4000-8000-000000000014', 'th', 'ระบบน้ำ', 'ปั๊ม ถัง และกรอง'),
  ('c2000001-0000-4000-8000-000000000014', 'ru', 'Водоснабжение', 'Насосы, баки, фильтры'),
  ('c2000001-0000-4000-8000-000000000014', 'he', 'מערכות מים', 'משאבות, מכלים ומסננים'),
  ('c2000001-0000-4000-8000-000000000015', 'en', 'Internet and IT', 'Wi-Fi and small networks'),
  ('c2000001-0000-4000-8000-000000000015', 'th', 'อินเทอร์เน็ตและไอที', 'ไวไฟและเครือข่าย'),
  ('c2000001-0000-4000-8000-000000000015', 'ru', 'Интернет и IT', 'Wi-Fi и сети'),
  ('c2000001-0000-4000-8000-000000000015', 'he', 'אינטרנט ומחשוב', 'רשת אלחוטית'),
  ('c2000001-0000-4000-8000-000000000016', 'en', 'Locksmith', 'Locks and keys'),
  ('c2000001-0000-4000-8000-000000000016', 'th', 'ช่างกุญแจ', 'กุญแจและแม่กุญแจ'),
  ('c2000001-0000-4000-8000-000000000016', 'ru', 'Слесарь', 'Замки и ключи'),
  ('c2000001-0000-4000-8000-000000000016', 'he', 'מנעולן', 'מנעולים ומפתחות'),
  ('c2000001-0000-4000-8000-000000000017', 'en', 'Waste collection', 'Rubbish and haul-away'),
  ('c2000001-0000-4000-8000-000000000017', 'th', 'เก็บขยะ', 'ขยะและขนออก'),
  ('c2000001-0000-4000-8000-000000000017', 'ru', 'Вывоз мусора', 'Мусор и вывоз'),
  ('c2000001-0000-4000-8000-000000000017', 'he', 'פינוי פסולת', 'אשפה ופינוי'),
  ('c2000001-0000-4000-8000-000000000018', 'en', 'Moving and delivery', 'Moving things locally'),
  ('c2000001-0000-4000-8000-000000000018', 'th', 'ขนย้ายและส่งของ', 'ย้ายของในพื้นที่'),
  ('c2000001-0000-4000-8000-000000000018', 'ru', 'Переезд и доставка', 'Местные перевозки'),
  ('c2000001-0000-4000-8000-000000000018', 'he', 'הובלה ומשלוחים', 'הובלה מקומית'),
  ('c2000001-0000-4000-8000-000000000019', 'en', 'Other', 'A trade that is not listed yet'),
  ('c2000001-0000-4000-8000-000000000019', 'th', 'อื่นๆ', 'งานที่ยังไม่มีหมวด'),
  ('c2000001-0000-4000-8000-000000000019', 'ru', 'Другое', 'Услуга вне списка'),
  ('c2000001-0000-4000-8000-000000000019', 'he', 'אחר', 'מקצוע שעוד לא ברשימה')
on conflict (category_id, locale) do nothing;

insert into public.pro_areas (id, slug, country_code, parent_id, level, lat, lng, demo_market) values
  ('a2000001-0000-4000-8000-000000000001', 'th', 'TH', null, 'country', null, null, false),
  ('a2000001-0000-4000-8000-000000000002', 'th-surat', 'TH', 'a2000001-0000-4000-8000-000000000001', 'region', null, null, false),
  ('a2000001-0000-4000-8000-000000000003', 'th-phangan', 'TH', 'a2000001-0000-4000-8000-000000000002', 'locality', 9.7318, 100.0136, true),
  ('a2000001-0000-4000-8000-000000000004', 'thong-sala', 'TH', 'a2000001-0000-4000-8000-000000000003', 'district', 9.714, 99.986, false),
  ('a2000001-0000-4000-8000-000000000005', 'haad-rin', 'TH', 'a2000001-0000-4000-8000-000000000003', 'district', 9.674, 100.066, false),
  ('a2000001-0000-4000-8000-000000000006', 'baan-tai', 'TH', 'a2000001-0000-4000-8000-000000000003', 'district', 9.705, 99.991, false),
  ('a2000001-0000-4000-8000-000000000007', 'chaloklum', 'TH', 'a2000001-0000-4000-8000-000000000003', 'district', 9.778, 100.045, false),
  ('a2000001-0000-4000-8000-000000000008', 'hin-kong', 'TH', 'a2000001-0000-4000-8000-000000000003', 'district', 9.735, 99.978, false),
  ('a2000001-0000-4000-8000-000000000009', 'th-samui', 'TH', 'a2000001-0000-4000-8000-000000000002', 'locality', 9.512, 100.013, false),
  ('a2000001-0000-4000-8000-000000000010', 'nathon', 'TH', 'a2000001-0000-4000-8000-000000000009', 'district', 9.535, 99.935, false),
  ('a2000001-0000-4000-8000-000000000011', 'maenam', 'TH', 'a2000001-0000-4000-8000-000000000009', 'district', 9.570, 100.010, false),
  ('a2000001-0000-4000-8000-000000000012', 'bophut', 'TH', 'a2000001-0000-4000-8000-000000000009', 'district', 9.560, 100.025, false),
  ('a2000001-0000-4000-8000-000000000013', 'chaweng', 'TH', 'a2000001-0000-4000-8000-000000000009', 'district', 9.530, 100.060, false),
  ('a2000001-0000-4000-8000-000000000014', 'lamai', 'TH', 'a2000001-0000-4000-8000-000000000009', 'district', 9.470, 100.040, false),
  ('a2000001-0000-4000-8000-000000000015', 'lipa-noi', 'TH', 'a2000001-0000-4000-8000-000000000009', 'district', 9.490, 99.960, false),
  ('a2000001-0000-4000-8000-000000000016', 'th-tao', 'TH', 'a2000001-0000-4000-8000-000000000002', 'locality', 10.095, 99.840, false),
  ('a2000001-0000-4000-8000-000000000017', 'mae-haad', 'TH', 'a2000001-0000-4000-8000-000000000016', 'district', 10.084, 99.826, false),
  ('a2000001-0000-4000-8000-000000000018', 'sairee', 'TH', 'a2000001-0000-4000-8000-000000000016', 'district', 10.099, 99.827, false),
  ('a2000001-0000-4000-8000-000000000019', 'chalok-baan-kao', 'TH', 'a2000001-0000-4000-8000-000000000016', 'district', 10.062, 99.825, false),
  ('a2000001-0000-4000-8000-000000000020', 'hin-wong', 'TH', 'a2000001-0000-4000-8000-000000000016', 'district', 10.104, 99.843, false),
  ('a2000001-0000-4000-8000-000000000021', 'tanote', 'TH', 'a2000001-0000-4000-8000-000000000016', 'district', 10.075, 99.848, false)
on conflict (id) do nothing;

insert into public.pro_area_translations (area_id, locale, name) values
  ('a2000001-0000-4000-8000-000000000001', 'en', 'Thailand'),
  ('a2000001-0000-4000-8000-000000000001', 'th', 'ประเทศไทย'),
  ('a2000001-0000-4000-8000-000000000001', 'ru', 'Таиланд'),
  ('a2000001-0000-4000-8000-000000000001', 'he', 'תאילנד'),
  ('a2000001-0000-4000-8000-000000000002', 'en', 'Surat Thani'),
  ('a2000001-0000-4000-8000-000000000002', 'th', 'สุราษฎร์ธานี'),
  ('a2000001-0000-4000-8000-000000000002', 'ru', 'Сураттхани'),
  ('a2000001-0000-4000-8000-000000000002', 'he', 'סוראט תאני'),
  ('a2000001-0000-4000-8000-000000000003', 'en', 'Koh Phangan'),
  ('a2000001-0000-4000-8000-000000000003', 'th', 'เกาะพะงัน'),
  ('a2000001-0000-4000-8000-000000000003', 'ru', 'Панган'),
  ('a2000001-0000-4000-8000-000000000003', 'he', 'קו פנגן'),
  ('a2000001-0000-4000-8000-000000000004', 'en', 'Thong Sala'),
  ('a2000001-0000-4000-8000-000000000004', 'th', 'ท้องศาลา'),
  ('a2000001-0000-4000-8000-000000000004', 'ru', 'Тонг Сала'),
  ('a2000001-0000-4000-8000-000000000004', 'he', 'תונג סאלה'),
  ('a2000001-0000-4000-8000-000000000005', 'en', 'Haad Rin'),
  ('a2000001-0000-4000-8000-000000000005', 'th', 'หาดริ้น'),
  ('a2000001-0000-4000-8000-000000000005', 'ru', 'Хад Рин'),
  ('a2000001-0000-4000-8000-000000000005', 'he', 'האד רין'),
  ('a2000001-0000-4000-8000-000000000006', 'en', 'Baan Tai'),
  ('a2000001-0000-4000-8000-000000000006', 'th', 'บ้านใต้'),
  ('a2000001-0000-4000-8000-000000000006', 'ru', 'Бан Тай'),
  ('a2000001-0000-4000-8000-000000000006', 'he', 'באן טאי'),
  ('a2000001-0000-4000-8000-000000000007', 'en', 'Chaloklum'),
  ('a2000001-0000-4000-8000-000000000007', 'th', 'โฉลกหลำ'),
  ('a2000001-0000-4000-8000-000000000007', 'ru', 'Чалоклум'),
  ('a2000001-0000-4000-8000-000000000007', 'he', 'צ׳אלוקלום'),
  ('a2000001-0000-4000-8000-000000000008', 'en', 'Hin Kong'),
  ('a2000001-0000-4000-8000-000000000008', 'th', 'หินกอง'),
  ('a2000001-0000-4000-8000-000000000008', 'ru', 'Хин Конг'),
  ('a2000001-0000-4000-8000-000000000008', 'he', 'הין קונג'),
  ('a2000001-0000-4000-8000-000000000009', 'en', 'Koh Samui'),
  ('a2000001-0000-4000-8000-000000000009', 'th', 'เกาะสมุย'),
  ('a2000001-0000-4000-8000-000000000009', 'ru', 'Самуи'),
  ('a2000001-0000-4000-8000-000000000009', 'he', 'קו סמוי'),
  ('a2000001-0000-4000-8000-000000000010', 'en', 'Nathon'),
  ('a2000001-0000-4000-8000-000000000010', 'th', 'นาทอน'),
  ('a2000001-0000-4000-8000-000000000010', 'ru', 'Натон'),
  ('a2000001-0000-4000-8000-000000000010', 'he', 'נאתון'),
  ('a2000001-0000-4000-8000-000000000011', 'en', 'Maenam'),
  ('a2000001-0000-4000-8000-000000000011', 'th', 'แม่น้ำ'),
  ('a2000001-0000-4000-8000-000000000011', 'ru', 'Маенам'),
  ('a2000001-0000-4000-8000-000000000011', 'he', 'מאנאם'),
  ('a2000001-0000-4000-8000-000000000012', 'en', 'Bophut'),
  ('a2000001-0000-4000-8000-000000000012', 'th', 'บ่อผุด'),
  ('a2000001-0000-4000-8000-000000000012', 'ru', 'Бопхут'),
  ('a2000001-0000-4000-8000-000000000012', 'he', 'בופוט'),
  ('a2000001-0000-4000-8000-000000000013', 'en', 'Chaweng'),
  ('a2000001-0000-4000-8000-000000000013', 'th', 'เฉวง'),
  ('a2000001-0000-4000-8000-000000000013', 'ru', 'Чавенг'),
  ('a2000001-0000-4000-8000-000000000013', 'he', 'צ׳וואנג'),
  ('a2000001-0000-4000-8000-000000000014', 'en', 'Lamai'),
  ('a2000001-0000-4000-8000-000000000014', 'th', 'ละไม'),
  ('a2000001-0000-4000-8000-000000000014', 'ru', 'Ламай'),
  ('a2000001-0000-4000-8000-000000000014', 'he', 'למאי'),
  ('a2000001-0000-4000-8000-000000000015', 'en', 'Lipa Noi'),
  ('a2000001-0000-4000-8000-000000000015', 'th', 'ลิปะน้อย'),
  ('a2000001-0000-4000-8000-000000000015', 'ru', 'Липа Ной'),
  ('a2000001-0000-4000-8000-000000000015', 'he', 'ליפה נוי'),
  ('a2000001-0000-4000-8000-000000000016', 'en', 'Koh Tao'),
  ('a2000001-0000-4000-8000-000000000016', 'th', 'เกาะเต่า'),
  ('a2000001-0000-4000-8000-000000000016', 'ru', 'Тао'),
  ('a2000001-0000-4000-8000-000000000016', 'he', 'קו טאו'),
  ('a2000001-0000-4000-8000-000000000017', 'en', 'Mae Haad'),
  ('a2000001-0000-4000-8000-000000000017', 'th', 'แม่หาด'),
  ('a2000001-0000-4000-8000-000000000017', 'ru', 'Мэ Хад'),
  ('a2000001-0000-4000-8000-000000000017', 'he', 'מה האד'),
  ('a2000001-0000-4000-8000-000000000018', 'en', 'Sairee'),
  ('a2000001-0000-4000-8000-000000000018', 'th', 'ทรายรี'),
  ('a2000001-0000-4000-8000-000000000018', 'ru', 'Саири'),
  ('a2000001-0000-4000-8000-000000000018', 'he', 'סאירי'),
  ('a2000001-0000-4000-8000-000000000019', 'en', 'Chalok Baan Kao'),
  ('a2000001-0000-4000-8000-000000000019', 'th', 'โฉลกบ้านเก่า'),
  ('a2000001-0000-4000-8000-000000000019', 'ru', 'Чалок Бан Као'),
  ('a2000001-0000-4000-8000-000000000019', 'he', 'צ׳אלוק באן קאו'),
  ('a2000001-0000-4000-8000-000000000020', 'en', 'Hin Wong'),
  ('a2000001-0000-4000-8000-000000000020', 'th', 'หินวง'),
  ('a2000001-0000-4000-8000-000000000020', 'ru', 'Хин Вонг'),
  ('a2000001-0000-4000-8000-000000000020', 'he', 'הין וונג'),
  ('a2000001-0000-4000-8000-000000000021', 'en', 'Tanote'),
  ('a2000001-0000-4000-8000-000000000021', 'th', 'หาดตาโนด'),
  ('a2000001-0000-4000-8000-000000000021', 'ru', 'Танот'),
  ('a2000001-0000-4000-8000-000000000021', 'he', 'טאנוט')
on conflict (area_id, locale) do nothing;

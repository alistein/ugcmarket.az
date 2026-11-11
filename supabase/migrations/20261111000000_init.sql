-- UGCMarket MVP schema. Source of truth for the database.
-- After changing: `npm run db:types` to regenerate src/types/database.ts

create extension if not exists citext;

-- ── Enums ────────────────────────────────────────────────────────────────
create type public.user_role as enum ('brand', 'creator', 'admin');
create type public.account_status as enum ('active', 'blocked');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.social_network as enum ('instagram', 'tiktok', 'youtube');
create type public.collaboration_model as enum ('post', 'ugc');
create type public.compensation_type as enum ('money', 'product', 'service', 'barter', 'unpaid');
create type public.post_format as enum ('reels', 'stories', 'post', 'tiktok_video', 'youtube_short', 'ugc_video', 'other');
create type public.campaign_status as enum ('draft', 'pending_review', 'published', 'paused', 'closed', 'rejected');

-- ── Profiles (1:1 with auth.users) ───────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role,                       -- null until onboarding
  locale text not null default 'az' check (locale in ('az','ru','en')),
  status public.account_status not null default 'active',
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ── Creators ─────────────────────────────────────────────────────────────
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles on delete cascade,
  handle citext not null unique check (handle ~ '^[a-z0-9_.]{3,30}$'),
  display_name text not null,
  avatar_url text,
  city text not null,
  country char(2) not null default 'AZ',
  categories text[] not null default '{}',
  languages text[] not null default '{}',
  bio text,
  barter_open boolean not null default false,
  review_status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_socials (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators on delete cascade,
  network public.social_network not null,
  handle text not null,
  followers integer not null default 0 check (followers >= 0),
  avg_views integer check (avg_views >= 0),
  verified boolean not null default false,       -- true only via future API verification
  unique (creator_id, network)
);

create table public.creator_prices (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators on delete cascade,
  format public.post_format not null,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'AZN',
  unique (creator_id, format)
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators on delete cascade,
  url text not null,
  network public.social_network not null,
  title text,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

-- Private contact details: never readable by other users directly.
-- The API reveals them with the service-role client after logging an application.
create table public.creator_contacts (
  creator_id uuid primary key references public.creators on delete cascade,
  instagram text,
  phone text
);

-- ── Brands ───────────────────────────────────────────────────────────────
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles on delete cascade,
  name text not null,
  logo_url text,
  category text not null,
  website text,
  review_status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_contacts (
  brand_id uuid primary key references public.brands on delete cascade,
  instagram text,
  phone text
);

-- ── Campaigns ────────────────────────────────────────────────────────────
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands on delete cascade,
  title text not null,
  description text not null,
  promoted_item text,
  category text not null,
  collaboration_model public.collaboration_model not null default 'post',
  network public.social_network not null,
  format public.post_format not null,
  posts_count smallint not null default 1,
  compensation_type public.compensation_type not null,
  compensation_value numeric(10,2),
  compensation_details text,
  currency text not null default 'AZN',
  creators_needed smallint not null default 1,
  min_followers integer not null default 0,
  city text,
  deadline date not null,
  requirements text,
  usage_rights text,
  status public.campaign_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index campaigns_board_idx on public.campaigns (status, published_at desc);

-- ── Applications (apply → contact reveal; deal happens off-platform) ─────
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns on delete cascade,
  creator_id uuid not null references public.creators on delete cascade,
  message text,
  contact_revealed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, creator_id)
);

-- ── Post submissions (the views KPI) ─────────────────────────────────────
create table public.post_submissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  url text not null,
  posted_at date,
  views integer not null check (views >= 0),
  likes integer, comments integer, shares integer, saves integer,
  screenshot_path text,
  self_reported boolean not null default true,
  confirmed_by_brand_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Admin audit log ──────────────────────────────────────────────────────
create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles,
  target_type text not null,
  target_id uuid not null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- ── updated_at triggers ──────────────────────────────────────────────────
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger creators_touch before update on public.creators for each row execute function public.touch_updated_at();
create trigger brands_touch before update on public.brands for each row execute function public.touch_updated_at();
create trigger campaigns_touch before update on public.campaigns for each row execute function public.touch_updated_at();

-- ── Row Level Security (second layer; API routes check roles first) ──────
alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.creator_socials enable row level security;
alter table public.creator_prices enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.brands enable row level security;
alter table public.creator_contacts enable row level security;
alter table public.brand_contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.applications enable row level security;
alter table public.post_submissions enable row level security;
alter table public.admin_actions enable row level security;

-- profiles: own row; role can be set once (null → brand|creator) via API
create policy "profiles: read own" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role is distinct from 'admin');

-- creators: approved profiles are public; owner/admin see all
create policy "creators: public read approved" on public.creators for select
  using (review_status = 'approved' or profile_id = auth.uid() or public.is_admin());
create policy "creators: owner insert" on public.creators for insert
  with check (profile_id = auth.uid() and public.my_role() = 'creator');
create policy "creators: owner update" on public.creators for update using (profile_id = auth.uid());

create policy "socials: read" on public.creator_socials for select using (
  exists (select 1 from public.creators c where c.id = creator_id));
create policy "socials: owner write" on public.creator_socials for all using (
  exists (select 1 from public.creators c where c.id = creator_id and c.profile_id = auth.uid()));
create policy "prices: read" on public.creator_prices for select using (
  exists (select 1 from public.creators c where c.id = creator_id));
create policy "prices: owner write" on public.creator_prices for all using (
  exists (select 1 from public.creators c where c.id = creator_id and c.profile_id = auth.uid()));
create policy "portfolio: read" on public.portfolio_items for select using (
  exists (select 1 from public.creators c where c.id = creator_id));
create policy "portfolio: owner write" on public.portfolio_items for all using (
  exists (select 1 from public.creators c where c.id = creator_id and c.profile_id = auth.uid()));

-- brands
create policy "brands: public read approved" on public.brands for select
  using (review_status = 'approved' or profile_id = auth.uid() or public.is_admin());
create policy "brands: owner insert" on public.brands for insert
  with check (profile_id = auth.uid() and public.my_role() = 'brand');
create policy "brands: owner update" on public.brands for update using (profile_id = auth.uid());

-- contacts: owner only (others get them via API after applying)
create policy "creator_contacts: owner" on public.creator_contacts for all using (
  exists (select 1 from public.creators c where c.id = creator_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from public.creators c where c.id = creator_id and c.profile_id = auth.uid()));
create policy "brand_contacts: owner" on public.brand_contacts for all using (
  exists (select 1 from public.brands b where b.id = brand_id and b.profile_id = auth.uid()))
  with check (exists (select 1 from public.brands b where b.id = brand_id and b.profile_id = auth.uid()));

-- campaigns: published are public; owner brand sees own drafts
create policy "campaigns: public read published" on public.campaigns for select using (
  status = 'published'
  or exists (select 1 from public.brands b where b.id = brand_id and b.profile_id = auth.uid())
  or public.is_admin());
create policy "campaigns: owner insert" on public.campaigns for insert with check (
  exists (select 1 from public.brands b where b.id = brand_id and b.profile_id = auth.uid()));
create policy "campaigns: owner update" on public.campaigns for update using (
  exists (select 1 from public.brands b where b.id = brand_id and b.profile_id = auth.uid()));

-- applications: creator sees own; brand sees applications to own campaigns
create policy "applications: read" on public.applications for select using (
  exists (select 1 from public.creators c where c.id = creator_id and c.profile_id = auth.uid())
  or exists (select 1 from public.campaigns k join public.brands b on b.id = k.brand_id
             where k.id = campaign_id and b.profile_id = auth.uid())
  or public.is_admin());
create policy "applications: creator insert" on public.applications for insert with check (
  exists (select 1 from public.creators c where c.id = creator_id and c.profile_id = auth.uid()
          and c.review_status = 'approved')
  and exists (select 1 from public.campaigns k where k.id = campaign_id and k.status = 'published'));
create policy "applications: creator update own" on public.applications for update using (
  exists (select 1 from public.creators c where c.id = creator_id and c.profile_id = auth.uid()));

-- post submissions: creator of the application writes; both sides read
create policy "posts: read" on public.post_submissions for select using (
  exists (select 1 from public.applications a
          join public.creators c on c.id = a.creator_id
          join public.campaigns k on k.id = a.campaign_id
          join public.brands b on b.id = k.brand_id
          where a.id = application_id and (c.profile_id = auth.uid() or b.profile_id = auth.uid()))
  or public.is_admin());
create policy "posts: creator insert" on public.post_submissions for insert with check (
  exists (select 1 from public.applications a join public.creators c on c.id = a.creator_id
          where a.id = application_id and c.profile_id = auth.uid()));
create policy "posts: brand confirm" on public.post_submissions for update using (
  exists (select 1 from public.applications a
          join public.campaigns k on k.id = a.campaign_id
          join public.brands b on b.id = k.brand_id
          where a.id = application_id and b.profile_id = auth.uid()));

-- admin_actions: admins only (writes go through service-role client)
create policy "admin_actions: admin read" on public.admin_actions for select using (public.is_admin());

-- ── Storage buckets ──────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('logos', 'logos', true),
  ('post-screenshots', 'post-screenshots', false)
on conflict (id) do nothing;

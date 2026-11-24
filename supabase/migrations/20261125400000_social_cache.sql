-- Shared cache of provider results (Apify, official APIs), keyed by what was fetched rather than
-- by who asked: an Instagram account ("profile", "instagram:natgeo") or a post ("post",
-- "instagram:DgBQriHgRoa"). Re-adding a Reel, two creators adding the same link, or "Hesabı qoş"
-- on an account we checked recently reuse the stored result instead of paying for a new fetch.
-- Service role only: RLS on, no policies.
create table if not exists public.social_cache (
  kind text not null check (kind in ('profile', 'post')),
  key text not null,
  source text not null,
  data jsonb not null,
  fetched_at timestamptz not null default now(),
  primary key (kind, key)
);
alter table public.social_cache enable row level security;
revoke all on public.social_cache from anon, authenticated;

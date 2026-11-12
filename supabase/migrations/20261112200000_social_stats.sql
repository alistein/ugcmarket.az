-- Automatically checked social numbers (followers, average views/likes), one row per creator
-- and network. Written only by the server (service role) through pluggable providers
-- (official APIs, or a third-party data provider until Meta/TikTok review is done).
-- Self-reported numbers stay in creator_socials; the UI prefers these when the handle matches.

create table public.creator_social_stats (
  creator_id uuid not null references public.creators on delete cascade,
  network public.social_network not null,
  handle text not null,
  followers integer check (followers >= 0),
  posts integer check (posts >= 0),
  avg_views integer check (avg_views >= 0),
  avg_likes integer check (avg_likes >= 0),
  recent jsonb not null default '[]'::jsonb,   -- last few posts: url, views, likes, comments, posted_at
  source text,                                 -- provider id that produced the numbers
  fetched_at timestamptz,                      -- last successful fetch
  attempted_at timestamptz not null default now(),
  error text,                                  -- last failure (internal; not shown to users)
  primary key (creator_id, network)
);

alter table public.creator_social_stats enable row level security;

-- Same visibility as creator_socials: whoever can see the creator can see the numbers.
create policy "social_stats: read" on public.creator_social_stats for select using (
  exists (select 1 from public.creators c where c.id = creator_id));

-- Nobody writes from the client; the service role bypasses RLS and grants.
revoke insert, update, delete on public.creator_social_stats from anon, authenticated;
-- The error column is internal.
revoke select on public.creator_social_stats from anon, authenticated;
grant select (creator_id, network, handle, followers, posts, avg_views, avg_likes, recent, source, fetched_at)
  on public.creator_social_stats to anon, authenticated;

-- Numbers for individual portfolio posts (e.g. a Reel link): views, likes, comments.
-- Written only by the server through post providers (src/server/social), like creator_social_stats.
-- owner_handle lets the UI show numbers only when the post belongs to the creator's own account.

create table public.portfolio_item_stats (
  portfolio_item_id uuid primary key references public.portfolio_items on delete cascade,
  owner_handle text,
  views integer check (views >= 0),
  likes integer check (likes >= 0),
  comments integer check (comments >= 0),
  posted_at timestamptz,
  source text,
  fetched_at timestamptz,
  attempted_at timestamptz not null default now(),
  error text
);

alter table public.portfolio_item_stats enable row level security;

create policy "portfolio_stats: read" on public.portfolio_item_stats for select using (
  exists (select 1 from public.portfolio_items p where p.id = portfolio_item_id));

revoke insert, update, delete on public.portfolio_item_stats from anon, authenticated;
revoke select on public.portfolio_item_stats from anon, authenticated;
grant select (portfolio_item_id, owner_handle, views, likes, comments, posted_at, source, fetched_at)
  on public.portfolio_item_stats to anon, authenticated;

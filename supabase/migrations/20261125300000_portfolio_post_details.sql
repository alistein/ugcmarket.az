-- More of what the post provider returns, for the portfolio post sheet: what was said, who was
-- tagged (brands love seeing past partners), length, audio and whether it was a paid partnership.
alter table public.portfolio_item_stats
  add column if not exists caption text check (caption is null or char_length(caption) <= 2200),
  add column if not exists hashtags text[] not null default '{}',
  add column if not exists mentions text[] not null default '{}',
  add column if not exists duration_seconds numeric(8, 2),
  add column if not exists music text,
  add column if not exists paid_partnership boolean;

-- Readable column by column, like the numbers (errors and attempts stay private).
grant select (caption, hashtags, mentions, duration_seconds, music, paid_partnership)
  on public.portfolio_item_stats to anon, authenticated;

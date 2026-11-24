-- portfolio_item_stats is readable column by column (errors and attempts stay private);
-- the cover added in 20261125200000 is public like the numbers.
grant select (thumbnail_url) on public.portfolio_item_stats to anon, authenticated;

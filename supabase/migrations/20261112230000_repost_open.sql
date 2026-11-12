-- Deal terms: next to barter_open, a creator can say they work for free in exchange for a repost
-- (the brand shares their Reels or story). Neither flag set = paid only.
alter table public.creators add column if not exists repost_open boolean not null default false;

grant insert (repost_open) on public.creators to authenticated;
grant update (repost_open) on public.creators to authenticated;

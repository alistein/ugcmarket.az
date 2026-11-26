-- Content directions (spec "Content directions and removing lifestyle tags", 2026-11-26).
--
-- 1. Categories become 29 "Kontent istiqamətləri". Five old slugs merge into others:
--    skincare, haircare → beauty · jewelry → fashion · electronics → tech · humor → entertainment.
--    Creators and listings share the list, so both are remapped (no duplicates, order kept).
-- 2. "Həyat tərzi və maraqlar" is removed: the lifestyle_tags column and its check go.
--
-- Deploy the code first (it no longer reads lifestyle_tags), then push this.

create or replace function pg_temp.new_direction(v text) returns text language sql immutable as $$
  select case v
    when 'skincare' then 'beauty'
    when 'haircare' then 'beauty'
    when 'jewelry' then 'fashion'
    when 'electronics' then 'tech'
    when 'humor' then 'entertainment'
    else v
  end
$$;

-- Creators: map, drop duplicates, keep the creator's order.
update public.creators c
set categories = coalesce((
  select array_agg(m.v order by m.first)
  from (
    select pg_temp.new_direction(u.v) as v, min(u.ord) as first
    from unnest(c.categories) with ordinality as u(v, ord)
    group by 1
  ) m
), '{}')
where c.categories && array['skincare', 'haircare', 'jewelry', 'electronics', 'humor'];

-- Listings: one direction each.
update public.campaigns
set category = pg_temp.new_direction(category)
where category in ('skincare', 'haircare', 'jewelry', 'electronics', 'humor');

-- Lifestyle tags: gone for good.
alter table public.creators drop constraint if exists creators_lifestyle_len;
alter table public.creators drop column if exists lifestyle_tags;

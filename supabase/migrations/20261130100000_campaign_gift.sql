-- What the brand gives on top of the pay (founders, 2026-11-26): a product, a service or nothing.
-- Separate from compensation_type; the card shows "+ product gift" / "+ service gift".
alter table public.campaigns
  add column gift_type text not null default 'none'
    constraint campaigns_gift_type check (gift_type in ('product', 'service', 'none'));

-- Brands write it like the other content columns (grants from 20261119100000).
grant insert (gift_type), update (gift_type) on public.campaigns to authenticated;

-- Bidding (founders, 2026-11-23): a brand posts a listing without a fixed price and each creator
-- names their price when applying. compensation_value on a 'bid' listing is an optional budget
-- ceiling. Bids are sealed: applications RLS already shows a bid only to its creator and the brand.
alter type public.compensation_type add value if not exists 'bid';

alter table public.applications
  add column bid_amount numeric(10,2),
  add constraint applications_bid_amount_positive check (bid_amount is null or bid_amount > 0);

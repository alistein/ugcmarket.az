-- Brands can archive finished listings (drafts, rejected, closed) to tidy their list.
-- Archive is not a status: the listing keeps its status and comes back as it was when restored.
-- Like status, it's written by the API (setCampaignArchived, service role) after the ownership
-- check; the column grants in 20261119100000_campaign_status_guard don't include it.

alter table public.campaigns add column archived_at timestamptz;

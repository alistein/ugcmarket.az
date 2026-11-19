-- Listing (campaign) hardening, same hole as brands/creators in 20261112100000_creator_profile.
-- Before: "campaigns: owner insert/update" let a brand write ANY column through PostgREST,
-- including status = 'published' (skipping admin review) and published_at.
-- Now: brands write content columns only. status / published_at are set by the API
-- (changeCampaignStatus, service role) after its checks, and by admins.

revoke insert, update on public.campaigns from anon, authenticated;

grant insert (
  brand_id, title, description, promoted_item, category, collaboration_model, network, format,
  posts_count, compensation_type, compensation_value, compensation_details, currency,
  creators_needed, min_followers, city, deadline, requirements, usage_rights
) on public.campaigns to authenticated;

grant update (
  title, description, promoted_item, category, collaboration_model, network, format,
  posts_count, compensation_type, compensation_value, compensation_details, currency,
  creators_needed, min_followers, city, deadline, requirements, usage_rights
) on public.campaigns to authenticated;

-- Bounded sizes (the API validates the same limits).
alter table public.campaigns
  add constraint campaigns_title_len check (char_length(title) between 3 and 120),
  add constraint campaigns_description_len check (char_length(description) between 10 and 4000),
  add constraint campaigns_posts_count_range check (posts_count between 1 and 20),
  add constraint campaigns_creators_needed_range check (creators_needed between 1 and 100),
  add constraint campaigns_min_followers_nonneg check (min_followers >= 0),
  add constraint campaigns_compensation_value_nonneg check (compensation_value is null or compensation_value >= 0);

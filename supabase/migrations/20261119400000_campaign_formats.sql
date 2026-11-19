-- A listing asks for one or more content formats, each with its own count, e.g. 3 Reels and
-- 1 Stories (founders, 2026-11-19). campaigns.format + campaigns.posts_count become
-- campaigns.deliverables: [{"format": "reels", "count": 3}, {"format": "stories", "count": 1}].
-- Existing rows keep what they asked for. Shape, enum values and counts are validated by the API
-- (CampaignInput); the database bounds the size and requires one entry outside drafts.

alter table public.campaigns
  add column deliverables jsonb not null default '[]'::jsonb;

update public.campaigns
   set deliverables = jsonb_build_array(jsonb_build_object('format', format, 'count', posts_count));

-- Brands write it like the other content columns (grants from 20261119100000).
grant insert (deliverables), update (deliverables) on public.campaigns to authenticated;

alter table public.campaigns
  drop constraint campaigns_complete_unless_draft,
  drop constraint campaigns_posts_count_range,
  add constraint campaigns_deliverables_shape check (
    jsonb_typeof(deliverables) = 'array' and jsonb_array_length(deliverables) <= 7
  ),
  add constraint campaigns_complete_unless_draft check (
    status = 'draft'
    or (
      title is not null and char_length(title) >= 3
      and description is not null and char_length(description) >= 10
      and category is not null
      and deadline is not null
      and jsonb_array_length(deliverables) >= 1
    )
  );

alter table public.campaigns
  drop column format,
  drop column posts_count;

-- "UGC video (for the brand only)" is removed from the product (founders, 2026-11-25).
-- The post_format value 'ugc_video' and collaboration_model 'ugc' stay in the DB enums (Postgres
-- can't drop enum values cheaply); the API no longer accepts them. Existing data is cleaned up:
--   creator prices for UGC video are deleted;
--   a listing's UGC video deliverable becomes Reels (merged into an existing Reels entry, max 20);
--   every listing is posted on the creator's account.

delete from public.creator_prices where format = 'ugc_video';

with fixed as (
  select c.id,
         coalesce(
           (select jsonb_agg(jsonb_build_object('format', f, 'count', least(n, 20)) order by ord)
              from (
                select case when d->>'format' = 'ugc_video' then 'reels' else d->>'format' end as f,
                       sum((d->>'count')::int) as n,
                       min(i) as ord
                  from jsonb_array_elements(c.deliverables) with ordinality as e(d, i)
                 group by 1
              ) g),
           '[]'::jsonb
         ) as deliverables
    from public.campaigns c
   where c.deliverables @> '[{"format": "ugc_video"}]'
)
update public.campaigns c
   set deliverables = fixed.deliverables
  from fixed
 where c.id = fixed.id;

update public.campaigns set collaboration_model = 'post' where collaboration_model = 'ugc';

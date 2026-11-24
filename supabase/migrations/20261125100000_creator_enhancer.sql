-- Creator profile split: onboarding (core) + profile enhancer (spec "Creator Onboarding &
-- Profile Completeness", 2026-11-24).
--
-- Onboarding step 2 asks for the deal formats: paid, barter, collab. Barter and collab (the
-- repost deal) already exist as barter_open / repost_open; paid becomes its own flag.
-- Categories have no upper limit any more (all of them, incl. "Daha çox", live in step 2).
-- Enhancer: lifestyle tags (who the creator is), where they can film, and production skills.

alter table public.creators
  add column if not exists paid_open boolean not null default true,
  add column if not exists lifestyle_tags text[] not null default '{}',
  add column if not exists shoot_options text[] not null default '{}',
  add column if not exists skills text[] not null default '{}';

alter table public.creators drop constraint if exists creators_categories_len;
alter table public.creators
  add constraint creators_categories_len check (cardinality(categories) <= 40),
  add constraint creators_lifestyle_len check (cardinality(lifestyle_tags) <= 60),
  add constraint creators_shoot_len check (cardinality(shoot_options) <= 5),
  add constraint creators_skills_len check (cardinality(skills) <= 10),
  add constraint creators_deal_format check (paid_open or barter_open or repost_open);

grant insert (paid_open, lifestyle_tags, shoot_options, skills) on public.creators to authenticated;
grant update (paid_open, lifestyle_tags, shoot_options, skills) on public.creators to authenticated;

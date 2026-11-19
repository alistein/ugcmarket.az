-- "Reklam olunan məhsul" is gone from listings for good (founders, 2026-11-19): the title,
-- description and requirements already say what is being promoted.
alter table public.campaigns drop column promoted_item;

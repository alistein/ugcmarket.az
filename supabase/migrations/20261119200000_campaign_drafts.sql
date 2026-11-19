-- Drafts can be saved half-filled (founders, 2026-11-19): the listing's required fields are
-- only required once it leaves 'draft'. The API checks the full listing on publish; this
-- constraint is the backstop.

alter table public.campaigns
  alter column title drop not null,
  alter column description drop not null,
  alter column category drop not null,
  alter column deadline drop not null;

-- The length checks from 20261119100000 pass on null; a draft may also have a short title.
alter table public.campaigns
  drop constraint campaigns_title_len,
  drop constraint campaigns_description_len,
  add constraint campaigns_title_len check (title is null or char_length(title) between 1 and 120),
  add constraint campaigns_description_len check (description is null or char_length(description) <= 4000),
  add constraint campaigns_complete_unless_draft check (
    status = 'draft'
    or (
      title is not null and char_length(title) >= 3
      and description is not null and char_length(description) >= 10
      and category is not null
      and deadline is not null
    )
  );

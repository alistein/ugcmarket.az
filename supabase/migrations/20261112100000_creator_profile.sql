-- Creator profile hardening.
-- Before: "creators: owner insert/update" (and the same for brands) let an owner write ANY
-- column through PostgREST — including review_status = 'approved' (self-approval).
-- Now: column-level privileges; review_status / profile_id are admin-only (service role).

-- ── creators ───────────────────────────────────────────────────────────────
revoke insert, update on public.creators from anon, authenticated;
grant insert (profile_id, handle, display_name, avatar_url, city, country, categories, languages, bio, barter_open)
  on public.creators to authenticated;
grant update (handle, display_name, avatar_url, city, country, categories, languages, bio, barter_open)
  on public.creators to authenticated;

alter table public.creators
  add constraint creators_display_name_len check (char_length(display_name) between 1 and 80),
  add constraint creators_bio_len check (bio is null or char_length(bio) <= 600),
  add constraint creators_categories_len check (cardinality(categories) <= 5),
  add constraint creators_languages_len check (cardinality(languages) <= 6);

-- ── brands (same hole) ─────────────────────────────────────────────────────
revoke insert, update on public.brands from anon, authenticated;
grant insert (profile_id, name, logo_url, category, website) on public.brands to authenticated;
grant update (name, logo_url, category, website) on public.brands to authenticated;

-- ── child tables: bounded sizes ────────────────────────────────────────────
alter table public.creator_socials
  add constraint creator_socials_handle_len check (char_length(handle) between 1 and 60);
alter table public.portfolio_items
  add constraint portfolio_items_url_https check (url ~ '^https://'),
  add constraint portfolio_items_title_len check (title is null or char_length(title) <= 100);

-- ── Handle availability (pending creators are hidden by RLS, so a normal select can't tell) ──
create function public.handle_available(h text) returns boolean
language sql stable security definer set search_path = '' as $$
  select h ~ '^[a-z0-9_.]{3,30}$'
     and not exists (select 1 from public.creators where lower(handle::text) = lower(h)
                      and profile_id is distinct from auth.uid())
$$;
revoke execute on function public.handle_available(text) from public, anon;
grant execute on function public.handle_available(text) to authenticated;

-- ── Storage: images only, small ────────────────────────────────────────────
update storage.buckets
   set file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id in ('avatars', 'logos');
update storage.buckets
   set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'post-screenshots';

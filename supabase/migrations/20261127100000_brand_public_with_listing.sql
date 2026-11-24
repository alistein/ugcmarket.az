-- A published listing always shows its brand (name, logo, category). Until now brands were
-- public only once approved, so listings from a brand still in review showed "?" on the board.
-- Contacts stay in brand_contacts and are not affected.
--
-- The check runs as a security definer function: campaigns' own read policy looks at brands,
-- so a plain subquery here would make the two policies call each other.

create function public.brand_has_published_listing(b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.campaigns c where c.brand_id = b and c.status = 'published')
$$;

revoke execute on function public.brand_has_published_listing(uuid) from public;
grant execute on function public.brand_has_published_listing(uuid) to anon, authenticated;

create policy "brands: public read with a published listing" on public.brands for select
  using (public.brand_has_published_listing(id));

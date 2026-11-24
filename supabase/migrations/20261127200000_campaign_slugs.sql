-- Readable listing URLs: /campaigns/metbexde-her-gun-isime-yarayan-3-tapinti instead of a UUID.
--
-- The slug is set once, the first time a listing is published, from its title, and never changes
-- after that (edits to the title don't break links already shared). Drafts have none. Old UUID
-- links keep working: the app looks a listing up by id or slug and moves to the slug URL.
-- Written by the trigger only; brands can't set it (not in the column grants).

alter table public.campaigns add column slug text unique
  check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Azerbaijani and Russian letters to Latin, then anything else to "-". Max 60 characters.
create function public.slugify(t text) returns text
language plpgsql immutable set search_path = '' as $$
declare
  s text := coalesce(t, '');
begin
  -- Before lower(): "İ" would otherwise become "i" + a combining dot.
  s := replace(replace(s, 'İ', 'i'), 'I', 'i');
  s := lower(s);
  s := replace(s, chr(775), ''); -- stray combining dot above
  s := translate(s, 'əıöüğşçâîûéèàá', 'eiougscaiueeaa');
  -- Russian (multi-letter first)
  s := replace(s, 'щ', 'shch'); s := replace(s, 'ш', 'sh'); s := replace(s, 'ч', 'ch');
  s := replace(s, 'ж', 'zh');   s := replace(s, 'х', 'kh'); s := replace(s, 'ц', 'ts');
  s := replace(s, 'ю', 'yu');   s := replace(s, 'я', 'ya'); s := replace(s, 'ё', 'e');
  s := translate(s, 'абвгдезийклмнопрстуфыэъь', 'abvgdeziiklmnoprstufye');
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := trim(both '-' from s);
  s := trim(both '-' from left(s, 60));
  return nullif(s, '');
end
$$;

-- A slug not used by another listing: "title", then "title-2", "title-3"…
create function public.unique_campaign_slug(t text, self uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  base text := coalesce(public.slugify(t), 'elan');
  candidate text := base;
  n int := 1;
begin
  while exists (select 1 from public.campaigns where slug = candidate and id <> self) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  return candidate;
end
$$;

create function public.set_campaign_slug() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.slug is null and new.status = 'published' then
    new.slug := public.unique_campaign_slug(new.title, new.id);
  end if;
  return new;
end
$$;

create trigger campaigns_slug before insert or update of status on public.campaigns
  for each row execute function public.set_campaign_slug();

-- Backfill: every listing that has been published at some point (live, paused or closed ones
-- can still be opened from old links), oldest first so the first one keeps the plain slug.
do $$
declare r record;
begin
  for r in
    select id, title from public.campaigns
    where slug is null and published_at is not null
    order by published_at, id
  loop
    update public.campaigns set slug = public.unique_campaign_slug(r.title, r.id) where id = r.id;
  end loop;
end
$$;

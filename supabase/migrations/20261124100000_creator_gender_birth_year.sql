-- Who the creator is, so brands can pick a face that matches their customer (mom in her 30s,
-- student, ...). Nullable: profiles created before this keep working and are asked on next edit.
-- The app shows an age range, not the year. Bounds here are a sanity net; the app checks 16..80.
alter table public.creators
  add column if not exists gender text check (gender in ('female', 'male')),
  add column if not exists birth_year smallint check (birth_year between 1920 and 2020);

grant insert (gender, birth_year) on public.creators to authenticated;
grant update (gender, birth_year) on public.creators to authenticated;

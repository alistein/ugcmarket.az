-- Auth hardening.
-- Before: "profiles: update own" let any signed-in user PATCH their own row straight through
-- PostgREST with the anon key — e.g. set status 'blocked' → 'active' or switch brand ↔ creator.
-- Now: users can only change `locale` directly; role is chosen once via set_my_role();
-- status is admin-only (service role). Blocked accounts lose role-based write access in RLS.

-- ── profiles: column-level privileges ──────────────────────────────────────
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (locale) on public.profiles to authenticated;

drop policy "profiles: update own" on public.profiles;
create policy "profiles: update own locale" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ── Role: chosen once, brand|creator only, active accounts only ────────────
create function public.set_my_role(new_role public.user_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if new_role not in ('brand', 'creator') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  update public.profiles
     set role = new_role
   where id = auth.uid() and role is null and status = 'active';
  if not found then
    raise exception 'role_already_set' using errcode = 'P0001';
  end if;
end $$;

revoke execute on function public.set_my_role(public.user_role) from public, anon;
grant execute on function public.set_my_role(public.user_role) to authenticated;

-- ── Blocked accounts: no role → every "my_role() = …" insert policy fails ──
create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and status = 'active'
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles
                   where id = auth.uid() and status = 'active'), false)
$$;

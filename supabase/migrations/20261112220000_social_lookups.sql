-- Log of "connect account" lookups (each costs a paid provider call). Used to rate-limit per
-- user and to see spend. Server-only: no client access.
create table public.social_lookups (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  network public.social_network not null,
  handle text not null,
  ok boolean not null,
  source text,
  created_at timestamptz not null default now()
);
create index social_lookups_user_time_idx on public.social_lookups (user_id, created_at desc);

alter table public.social_lookups enable row level security;
revoke all on public.social_lookups from anon, authenticated;

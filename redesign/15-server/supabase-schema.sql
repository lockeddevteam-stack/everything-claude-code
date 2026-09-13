-- ===================================================================
-- LOCKED — Supabase schema.
--
-- ONE ROW PER KEY PER PERSON. The app already stores everything under
-- the keys in LKStore.syncKeys(); this is those keys, with the change
-- time the device records, so last-write-wins can be decided without
-- either side guessing. Nothing here reshapes the data: a value goes up
-- as the app stored it and comes back the same, which is what keeps a
-- migration a client concern and stops the server needing to know what
-- a split looks like.
--
-- Row level security is on everywhere and every policy is
-- `auth.uid() = user_id`. There is no shared table and no admin view:
-- a bug in a policy is the one bug in this file that loses somebody
-- else's data rather than their own.
-- ===================================================================

create extension if not exists "pgcrypto";

-- ---- who -----------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  username     text unique,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- A profile row is made once, when the account is, rather than on the
-- first write from a client that might never come.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- the data ------------------------------------------------------
-- `changed_at` is the DEVICE's clock, carried from LKStore.changedAt().
-- `server_at` is ours. The device decides what wins; ours is for
-- ordering a pull and for seeing clock skew when something looks wrong.
create table if not exists public.store (
  user_id    uuid not null references auth.users on delete cascade,
  key        text not null,
  value      jsonb not null,
  changed_at bigint not null,
  server_at  timestamptz not null default now(),
  deleted    boolean not null default false,
  primary key (user_id, key)
);

create index if not exists store_pull_idx on public.store (user_id, server_at desc);

alter table public.store enable row level security;

drop policy if exists "own rows" on public.store;
create policy "own rows" on public.store
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A push is last-write-wins on the DEVICE's clock, resolved here so two
-- phones racing cannot interleave a read and a write. An older write
-- landing late is dropped rather than overwriting a newer one.
create or replace function public.store_push(rows jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer := 0;
begin
  insert into public.store (user_id, key, value, changed_at, deleted)
  select auth.uid(),
         r->>'key',
         coalesce(r->'value', 'null'::jsonb),
         (r->>'changed_at')::bigint,
         coalesce((r->>'deleted')::boolean, false)
  from jsonb_array_elements(rows) as r
  on conflict (user_id, key) do update
    set value      = excluded.value,
        changed_at = excluded.changed_at,
        deleted    = excluded.deleted,
        server_at  = now()
    where public.store.changed_at < excluded.changed_at;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.store_push(jsonb) from public;
grant execute on function public.store_push(jsonb) to authenticated;

-- ---- entitlements --------------------------------------------------
-- Read-only to the client. Nothing the app can do makes somebody Pro:
-- this is written by the payment webhook and by nothing else, which is
-- the whole point of keeping the gate off the device.
create table if not exists public.entitlements (
  user_id    uuid primary key references auth.users on delete cascade,
  tier       text not null default 'free',
  status     text not null default 'none',
  trial_ends timestamptz,
  renews_at  timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "read own entitlement" on public.entitlements;
create policy "read own entitlement" on public.entitlements
  for select using (auth.uid() = user_id);
-- deliberately no insert/update/delete policy: the service role writes it.

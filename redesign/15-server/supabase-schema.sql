-- ===================================================================
-- WHAT THE LIVE PROJECT ACTUALLY IS.
--
-- This file used to be a blueprint: a `store` table, an `entitlements`
-- table, a schema nobody had run. The project it was written for already
-- existed with a different shape and real people's data in it, so the
-- blueprint was worse than nothing -- anybody following it would have
-- built a second backend beside the one in use.
--
-- So this is now a description, read off the project, plus the one
-- migration this work added. Running the CREATEs against the live
-- project is a no-op by design (`if not exists` throughout); running
-- them against a fresh project reproduces it.
--
-- The client reads and writes all of this with the publishable key and
-- nothing else. Row level security is what protects the data: every
-- policy below pins a row to auth.uid(). The service role key is the
-- Worker's alone and must never reach the browser.
-- ===================================================================

-- ---- who somebody is, and what they are paying for -----------------
-- Written by the payment webhook with the service key. The client only
-- ever reads it, so nothing a person does in the app can make them Pro.
create table if not exists public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  email                  text not null,
  display_name           text,
  trial_started_at       timestamptz not null default now(),
  trial_ends_at          timestamptz not null default (now() + interval '14 days'),
  subscription_status    text not null default 'trial'
                           check (subscription_status in
                             ('trial', 'active', 'expired', 'canceled', 'past_due')),
  current_plan           text check (current_plan in ('monthly', 'annual')),
  plan_expires_at        timestamptz,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- A profile exists from the moment the account does, so nothing the app
-- writes can fail on a missing foreign key.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- everything the app stores -------------------------------------
-- One row per key per person. The app's own keys, verbatim, as jsonb.
create table if not exists public.user_data (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  key        text not null,
  value      jsonb,
  updated_at timestamptz not null default now(),
  -- THE DEVICE'S OWN CLOCK. updated_at is stamped by the trigger below,
  -- so it records when the server heard rather than when somebody
  -- edited, and two phones cannot be ordered by it. Added by this work
  -- and backfilled from updated_at, so existing rows kept their real age
  -- instead of reading as brand new or as infinitely old -- either of
  -- which would have made the first sync destroy data.
  changed_at bigint,
  unique (user_id, key)
);

create index if not exists user_data_user_changed_idx
  on public.user_data (user_id, changed_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists user_data_updated_at on public.user_data;
create trigger user_data_updated_at before update on public.user_data
  for each row execute function public.set_updated_at();

-- A null value is a tombstone: the row stays so the deletion itself
-- syncs. Treating it as a value would restore something somebody deleted
-- on their other phone.

-- ---- the whole conflict rule, in one statement ---------------------
-- An incoming edit lands only when it is newer than the row already
-- there, so a stale phone coming back online cannot overwrite work done
-- since. SECURITY INVOKER: it writes rows for auth.uid() and nothing
-- else, which is exactly what the policy below already says, so it needs
-- no elevated rights.
create or replace function public.store_push(rows jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n integer := 0;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if rows is null or jsonb_typeof(rows) <> 'array' then
    return 0;
  end if;

  insert into public.user_data (user_id, key, value, changed_at)
  select uid,
         r ->> 'key',
         case when coalesce((r ->> 'deleted')::boolean, false) then null else r -> 'value' end,
         (r ->> 'changed_at')::bigint
    from jsonb_array_elements(rows) r
   where r ->> 'key' is not null
     and (r ->> 'changed_at') ~ '^[0-9]+$'
  on conflict (user_id, key) do update
     set value = excluded.value,
         changed_at = excluded.changed_at
   where public.user_data.changed_at is null
      or public.user_data.changed_at < excluded.changed_at;

  get diagnostics n = row_count;
  return n;
end
$$;

revoke all on function public.store_push(jsonb) from public, anon;
grant execute on function public.store_push(jsonb) to authenticated;

-- ---- how much of the free tier is spent ----------------------------
-- Counted by the Worker with the service key. The client never writes
-- these: a free limit a person can edit is not a limit.
create table if not exists public.usage_daily (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  date          date not null default current_date,
  coach_chats   integer not null default 0,
  meal_analyses integer not null default 0
);

create table if not exists public.usage_monthly (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  month            text not null,
  splits_generated integer not null default 0
);

-- ---- row level security --------------------------------------------
-- Every table, every row, pinned to the person it belongs to. This is
-- what makes the publishable key safe to ship in the browser: a stolen
-- key gets somebody an empty result set.
alter table public.profiles      enable row level security;
alter table public.user_data     enable row level security;
alter table public.usage_daily   enable row level security;
alter table public.usage_monthly enable row level security;

drop policy if exists user_owns_profile on public.profiles;
create policy user_owns_profile on public.profiles
  for all using (auth.uid() = id);

drop policy if exists user_owns_data on public.user_data;
create policy user_owns_data on public.user_data
  for all using (auth.uid() = user_id);

drop policy if exists user_owns_daily on public.usage_daily;
create policy user_owns_daily on public.usage_daily
  for all using (auth.uid() = user_id);

drop policy if exists user_owns_monthly on public.usage_monthly;
create policy user_owns_monthly on public.usage_monthly
  for all using (auth.uid() = user_id);

-- The Worker, and only the Worker. service_role bypasses RLS anyway;
-- these are explicit so the intent is readable rather than implied.
drop policy if exists service_all_profiles on public.profiles;
create policy service_all_profiles on public.profiles
  for all to service_role using (true) with check (true);

drop policy if exists service_all_data on public.user_data;
create policy service_all_data on public.user_data
  for all to service_role using (true) with check (true);

drop policy if exists service_all_daily on public.usage_daily;
create policy service_all_daily on public.usage_daily
  for all to service_role using (true) with check (true);

drop policy if exists service_all_monthly on public.usage_monthly;
create policy service_all_monthly on public.usage_monthly
  for all to service_role using (true) with check (true);

-- ---- one thing this file cannot do ---------------------------------
-- Leaked password protection is an Auth setting, not schema. It checks
-- new passwords against HaveIBeenPwned and is off on this project. Turn
-- it on under Authentication -> Policies in the dashboard.

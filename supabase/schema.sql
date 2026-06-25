-- ============================================================
-- KARELA SUPABASE SCHEMA - Phase 1: Auth + Profiles
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES TABLE
-- Mirrors the app's UserProfile shape. stats/settings are JSONB
-- so the existing profile.stats.* access pattern keeps working.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text,
  display_name    text,
  username        text,
  is_verified     boolean default false,
  profile_picture text,
  stats           jsonb default '{}'::jsonb,
  settings        jsonb default '{"units":"metric","notifications":true}'::jsonb,
  created_at      timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. ROW-LEVEL SECURITY
-- A user can only read/update their own profile row.
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 3. AUTO-CREATE PROFILE ON SIGNUP
-- Reads initial profile data from auth user_metadata (passed
-- from the signup screen) and creates the profiles row.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, username, stats, settings)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New Strider'),
    coalesce(new.raw_user_meta_data ->> 'username', 'Strider_' || substr(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data -> 'stats', '{}'::jsonb),
    coalesce(new.raw_user_meta_data -> 'settings', '{"units":"metric","notifications":true}'::jsonb)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 4. ATOMIC STAT INCREMENT
-- Replaces Firestore's increment() for nested stat fields.
-- Usage from client:
--   supabase.rpc('increment_stats', { p_user_id, p_deltas: { xp: 150, total_distance_km: 2.3 } })
-- Adds each numeric delta to the matching key inside stats JSONB.
-- ------------------------------------------------------------
create or replace function public.increment_stats(
  p_user_id uuid,
  p_deltas  jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  k text;
  v numeric;
begin
  if auth.uid() <> p_user_id then
    raise exception 'Not authorized to modify this profile';
  end if;

  for k, v in select key, value::numeric from jsonb_each_text(p_deltas)
  loop
    update public.profiles
    set stats = jsonb_set(
      stats,
      array[k],
      to_jsonb(coalesce((stats ->> k)::numeric, 0) + v)
    )
    where id = p_user_id;
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- 5. SET STAT FIELDS (non-numeric or absolute overwrites)
-- Usage: supabase.rpc('set_stats', { p_user_id, p_values: { last_daily_reset: '2026-06-25' } })
-- ------------------------------------------------------------
create or replace function public.set_stats(
  p_user_id uuid,
  p_values  jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() <> p_user_id then
    raise exception 'Not authorized to modify this profile';
  end if;

  update public.profiles
  set stats = stats || p_values
  where id = p_user_id;
end;
$$;

-- ============================================================
-- 6. MISSIONS TABLE
-- Replaces the Firestore users/{uid}/missions subcollection.
-- ============================================================
create table if not exists public.missions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  title           text,
  description     text,
  target_value    numeric default 0,
  current_value   numeric default 0,
  xp_reward       integer default 0,
  status          text default 'active',   -- active | claimed | completed | expired
  category        text default 'solo',     -- solo | team
  frequency       text default 'daily',    -- daily | weekly | monthly | limited
  type            text default 'distance',
  created_at_key  text,                    -- YYYY-MM-DD string used by reset logic
  created_at      timestamptz default now()
);

create index if not exists missions_user_idx on public.missions (user_id);
create index if not exists missions_filter_idx
  on public.missions (user_id, status, category, frequency);

alter table public.missions enable row level security;

drop policy if exists "Users manage own missions" on public.missions;
create policy "Users manage own missions"
  on public.missions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 7. RUN SUMMARIES TABLE
-- Replaces users/{uid}/run_summaries subcollection (Ani memory).
-- ============================================================
create table if not exists public.run_summaries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  summary     text,
  distance    numeric,
  avg_speed   numeric,
  created_at  timestamptz default now()
);

create index if not exists run_summaries_user_idx
  on public.run_summaries (user_id, created_at desc);

alter table public.run_summaries enable row level security;

drop policy if exists "Users manage own run summaries" on public.run_summaries;
create policy "Users manage own run summaries"
  on public.run_summaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

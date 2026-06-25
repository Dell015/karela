-- ============================================================
-- KARELA SUPABASE - Phase 1 additions
-- Run this AFTER schema.sql, in the Supabase SQL Editor.
-- ============================================================

-- 1. RUN HISTORY (raw completed-run log; written from summary screen)
create table if not exists public.run_history (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  distance_meters   numeric,
  duration_seconds  numeric,
  calories          numeric,
  xp_earned         integer,
  completed_at      timestamptz default now()
);

create index if not exists run_history_user_idx
  on public.run_history (user_id, completed_at desc);

alter table public.run_history enable row level security;

drop policy if exists "Users manage own run history" on public.run_history;
create policy "Users manage own run history"
  on public.run_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. ENABLE REALTIME (replaces Firestore onSnapshot)
-- Adds the tables to the realtime publication so the client
-- receives live row changes.
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.missions;

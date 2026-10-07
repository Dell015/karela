-- ============================================================
-- KARELA WEBSITE BACKEND (waitlist + survey)
--
-- Run this in a NEW Supabase project made only for the website.
-- Do NOT use the mobile app's project. The key you put on the site
-- is public, so this project must hold nothing private.
--
-- What this allows: anyone can ADD a row. Nobody can read, change
-- or delete rows with the public key. You read the data in the
-- Supabase dashboard (Table Editor), which uses your own login.
-- ============================================================

-- 1. WAITLIST ------------------------------------------------
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text,
  "timestamp" timestamptz,
  created_at timestamptz not null default now(),
  constraint waitlist_email_format check (
    char_length(email) <= 254
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint waitlist_source_len check (source is null or char_length(source) <= 60)
);

-- one row per email, case-insensitive
create unique index if not exists waitlist_email_unique
  on public.waitlist (lower(email));

-- 2. SURVEY --------------------------------------------------
create table if not exists public.survey_responses (
  id         uuid primary key default gen_random_uuid(),
  answers    jsonb not null,
  source     text,
  "timestamp" timestamptz,
  created_at timestamptz not null default now(),
  constraint survey_answers_object check (jsonb_typeof(answers) = 'object'),
  -- keeps abuse small: a real response is well under 4 KB
  constraint survey_answers_size check (pg_column_size(answers) <= 8192),
  constraint survey_source_len check (source is null or char_length(source) <= 60)
);

-- 3. ROW LEVEL SECURITY: insert only -------------------------
alter table public.waitlist enable row level security;
alter table public.survey_responses enable row level security;

drop policy if exists "anyone can join waitlist" on public.waitlist;
create policy "anyone can join waitlist"
  on public.waitlist for insert
  to anon
  with check (true);

drop policy if exists "anyone can submit survey" on public.survey_responses;
create policy "anyone can submit survey"
  on public.survey_responses for insert
  to anon
  with check (true);

-- no select / update / delete policies on purpose.
revoke all on public.waitlist from anon, authenticated;
revoke all on public.survey_responses from anon, authenticated;
grant insert on public.waitlist to anon;
grant insert on public.survey_responses to anon;

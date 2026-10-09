-- ============================================================
-- KARELA DEMO DATA: mock guilds competing for Tuguegarao landmarks
--
-- FOR SCREENSHOTS AND DEMOS ONLY. The people, squads and guilds here are
-- made up. Not a migration: don't add it to the numbered run order.
--
-- Run AFTER 13_territory.sql and landmarks_tuguegarao.sql (it needs the
-- Ugac Sur, Ugac Norte and Buntun landmarks).
--
-- What it adds:
--   18 mock accounts (fictional names, emails at karela-demo.invalid,
--      no password, so nobody can log in as them)
--   6 squads of 3, in 3 guilds:
--      Ugac Striders (teal), Cagayan Pacers (orange),
--      Sunrise Lakad Club (sky)
--   km logged inside the landmark circles, last month and this week, so
--   the Territory tab and the run map show three different states:
--      Ugac Sur    held by Ugac Striders (won it last month)
--      Ugac Norte  taken mid-month by Sunrise Lakad Club from
--                  Cagayan Pacers (last month's winner)
--      Buntun      claimed this month by Sunrise Lakad Club
--
-- All demo ids start with de31 (accounts), de32 (squads) or de33 (guilds).
-- Remove everything with remove_demo_guilds.sql.
--
-- Running it again replaces the demo data and moves "this week" to the
-- current week. Run it again before a demo if more than a few days pass.
-- ============================================================

DO $$
BEGIN
  IF (SELECT count(*) FROM public.landmarks WHERE name IN ('Ugac Sur', 'Ugac Norte', 'Buntun')) < 3 THEN
    RAISE EXCEPTION 'Run supabase/landmarks_tuguegarao.sql first: the Ugac Sur, Ugac Norte and Buntun landmarks are missing.';
  END IF;
END $$;

-- ---------- Start clean (removes only earlier demo rows) ----------
DELETE FROM public.guilds     WHERE id::text LIKE 'de330000-%';  -- also their km, badges, boosts
DELETE FROM public.squads     WHERE id::text LIKE 'de320000-%';  -- also their members
DELETE FROM auth.users        WHERE id::text LIKE 'de310000-%';  -- also their profiles

-- ---------- Accounts (the app's signup trigger makes their profiles) ----------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  ('de310000-0000-4000-8000-' || lpad(p.n::text, 12, '0'))::uuid,
  'authenticated', 'authenticated',
  p.username || '@karela-demo.invalid',
  '',
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object('display_name', p.display_name, 'username', p.username),
  now() - interval '60 days', now(),
  '', '', '', ''
FROM (VALUES
  ( 1, 'Joy T.',   'joy_t'),
  ( 2, 'Paolo R.', 'paolo_r'),
  ( 3, 'Liza M.',  'liza_m'),
  ( 4, 'Carlo D.', 'carlo_d'),
  ( 5, 'Ana B.',   'ana_b'),
  ( 6, 'Mark G.',  'mark_g'),
  ( 7, 'Rica S.',  'rica_s'),
  ( 8, 'Jun P.',   'jun_p'),
  ( 9, 'Mae L.',   'mae_l'),
  (10, 'Ken A.',   'ken_a'),
  (11, 'Bea C.',   'bea_c'),
  (12, 'Nico V.',  'nico_v'),
  (13, 'Grace F.', 'grace_f'),
  (14, 'Leo T.',   'leo_t'),
  (15, 'Ivy N.',   'ivy_n'),
  (16, 'Migs E.',  'migs_e'),
  (17, 'Tin O.',   'tin_o'),
  (18, 'Rey H.',   'rey_h')
) AS p (n, display_name, username);

-- ---------- Guilds (leader = the leader of the guild's first squad) ----------
INSERT INTO public.guilds (id, name, color, leader_id, created_at)
SELECT
  ('de330000-0000-4000-8000-' || lpad(g.n::text, 12, '0'))::uuid,
  g.name, g.color,
  ('de310000-0000-4000-8000-' || lpad(((g.n - 1) * 6 + 1)::text, 12, '0'))::uuid,
  now() - interval '50 days'
FROM (VALUES
  (1, 'Ugac Striders',      'teal'),
  (2, 'Cagayan Pacers',     'orange'),
  (3, 'Sunrise Lakad Club', 'sky')
) AS g (n, name, color);

-- ---------- Squads: squads 1-2 in guild 1, 3-4 in guild 2, 5-6 in guild 3 ----------
INSERT INTO public.squads (id, name, invite_code, created_by, created_at, guild_id, guild_joined_at)
SELECT
  ('de320000-0000-4000-8000-' || lpad(s.n::text, 12, '0'))::uuid,
  s.name,
  'DEMO0' || s.n,
  ('de310000-0000-4000-8000-' || lpad(((s.n - 1) * 3 + 1)::text, 12, '0'))::uuid,
  now() - interval '55 days',
  ('de330000-0000-4000-8000-' || lpad(((s.n + 1) / 2)::text, 12, '0'))::uuid,
  now() - interval '50 days'
FROM (VALUES
  (1, 'Ugac Morning Crew'),
  (2, 'Kalye Runners'),
  (3, 'Takbo Barkada'),
  (4, 'Night Pacers'),
  (5, 'Lakad Sabado'),
  (6, 'Campus Walkers')
) AS s (n, name);

-- ---------- Members: accounts 1-3 in squad 1, 4-6 in squad 2, ... ----------
INSERT INTO public.squad_members (user_id, squad_id, role, joined_at)
SELECT
  ('de310000-0000-4000-8000-' || lpad(u::text, 12, '0'))::uuid,
  ('de320000-0000-4000-8000-' || lpad(((u - 1) / 3 + 1)::text, 12, '0'))::uuid,
  CASE WHEN (u - 1) % 3 = 0 THEN 'leader' ELSE 'member' END,
  now() - interval '55 days'
FROM generate_series(1, 18) AS u;

-- ---------- km inside the landmark circles ----------
-- period 'prev' = last month (decides who holds the landmark now),
-- period 'week' = the last 7 days (this month's bars, and challenges).
-- Each total is split into n visits, shared out among the guild's members.
WITH t AS (
  SELECT
    date_trunc('month', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila' AS month_start,
    (date_trunc('month', now() AT TIME ZONE 'Asia/Manila') - interval '1 month') AT TIME ZONE 'Asia/Manila' AS prev_start
),
plan (landmark, guild_n, period, total_km, n) AS (
  VALUES
    -- Ugac Sur: Striders won last month and still lead
    ('Ugac Sur',   1, 'prev', 24.0, 6),
    ('Ugac Sur',   2, 'prev', 15.0, 4),
    ('Ugac Sur',   1, 'week', 18.6, 6),
    ('Ugac Sur',   2, 'week', 11.2, 4),
    ('Ugac Sur',   3, 'week',  4.6, 2),
    -- Ugac Norte: Pacers won last month, Sunrise ran 150%+ of them this week
    ('Ugac Norte', 2, 'prev', 20.0, 5),
    ('Ugac Norte', 1, 'prev',  8.0, 2),
    ('Ugac Norte', 3, 'week',  9.4, 4),
    ('Ugac Norte', 2, 'week',  3.0, 2),
    ('Ugac Norte', 1, 'week',  2.2, 1),
    -- Buntun: nobody last month, Sunrise claimed it this week
    ('Buntun',     3, 'week',  6.3, 3),
    ('Buntun',     1, 'week',  2.1, 1)
)
INSERT INTO public.territory_visits (id, user_id, guild_id, landmark_id, km, boosted, logged_at)
SELECT
  gen_random_uuid(),
  ('de310000-0000-4000-8000-' || lpad(((p.guild_n - 1) * 6 + (i - 1) % 6 + 1)::text, 12, '0'))::uuid,
  ('de330000-0000-4000-8000-' || lpad(p.guild_n::text, 12, '0'))::uuid,
  l.id,
  round(p.total_km / p.n, 2),
  false,
  CASE p.period
    WHEN 'prev' THEN t.prev_start + interval '1 day' * (2 + (i * 5) % 24) + interval '7 hours'
    ELSE LEAST(now(), GREATEST(t.month_start + interval '5 minutes',
                               now() - interval '1 hour' * (2 + (i * 31) % 140)))
  END
FROM plan p
CROSS JOIN t
CROSS JOIN LATERAL generate_series(1, p.n) AS i
JOIN public.landmarks l ON l.name = p.landmark;

-- Check 1: should list 3 guilds, each with 2 squads and 6 members.
SELECT g.name, g.color,
       (SELECT count(*) FROM public.squads s WHERE s.guild_id = g.id) AS squads,
       (SELECT count(*) FROM public.karela_guild_members(g.id)) AS members
FROM public.guilds g WHERE g.id::text LIKE 'de330000-%' ORDER BY g.name;

-- Check 2: who holds each landmark now. Expected:
--   Buntun      Sunrise Lakad Club  claimed
--   Ugac Norte  Sunrise Lakad Club  challenged
--   Ugac Sur    Ugac Striders       last_month
SELECT l.name AS landmark,
       public.karela_zone_holder(l.id) ->> 'name'   AS holder,
       public.karela_zone_holder(l.id) ->> 'reason' AS reason
FROM public.landmarks l
WHERE l.name IN ('Ugac Sur', 'Ugac Norte', 'Buntun')
ORDER BY l.name;

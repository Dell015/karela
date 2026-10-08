-- ============================================================
-- KARELA SUPABASE - 10: Streak protection and the Shop
-- Run in the Supabase SQL Editor AFTER 09_profile_pictures.sql.
--
-- 1. Protected days. Until now a Streak Freeze could be bought but nothing
--    ever used it. A "protected day" is a day the streak survives without
--    a run. Three things create one:
--      freeze  - used automatically for a missed day (settle_streak)
--      repair  - bought the day after a missed day (Shop)
--      shield  - the squad's Collective Shield (11_squads.sql)
--    A protected day keeps the streak alive but does not add to it.
--
-- 2. The Shop. Prices live in shop_items, so they can be changed here
--    without an app update. Every purchase runs on the server: the price is
--    read from the table and Gems are taken in the same transaction.
--
-- Days are counted in Philippine time (Asia/Manila), like the pilot.
-- Safe to run more than once.
-- ============================================================

-- ---------- Helpers ----------

CREATE OR REPLACE FUNCTION public.karela_today()
RETURNS date
LANGUAGE sql
STABLE
AS $$ SELECT (now() AT TIME ZONE 'Asia/Manila')::date $$;

-- Total XP ever earned: levels are 1,000 XP each (COMPUTATIONS.md).
CREATE OR REPLACE FUNCTION public.karela_total_xp(p_stats jsonb)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(0,
    (GREATEST(COALESCE((p_stats ->> 'level')::numeric, 1), 1) - 1) * 1000
    + COALESCE((p_stats ->> 'xp')::numeric, 0))::bigint
$$;

-- ---------- 1. Protected days ----------

CREATE TABLE IF NOT EXISTS public.streak_protections (
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  day        date NOT NULL,
  source     text NOT NULL CHECK (source IN ('freeze', 'repair', 'shield')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

ALTER TABLE public.streak_protections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own protected days" ON public.streak_protections;
CREATE POLICY "Users read own protected days"
  ON public.streak_protections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- No insert/update/delete policies: only the functions below write here.

-- Days with at least one finished run, in Philippine time.
CREATE OR REPLACE FUNCTION public.karela_run_days(p_user uuid, p_since date)
RETURNS SETOF date
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT (completed_at AT TIME ZONE 'Asia/Manila')::date
  FROM public.run_history
  WHERE user_id = p_user
    AND completed_at >= (p_since::timestamp AT TIME ZONE 'Asia/Manila')
$$;

-- Streak ending on p_end: run days add 1, protected days keep it going.
CREATE OR REPLACE FUNCTION public.karela_streak_at(p_user uuid, p_end date)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_runs   date[];
  v_prot   date[];
  v_day    date := p_end;
  v_streak integer := 0;
BEGIN
  SELECT array_agg(d) INTO v_runs FROM public.karela_run_days(p_user, p_end - 400) d;
  SELECT array_agg(day) INTO v_prot FROM public.streak_protections
    WHERE user_id = p_user AND day > p_end - 400 AND day <= p_end;
  v_runs := COALESCE(v_runs, '{}');
  v_prot := COALESCE(v_prot, '{}');

  LOOP
    IF v_day = ANY (v_runs) THEN
      v_streak := v_streak + 1;
    ELSIF NOT (v_day = ANY (v_prot)) THEN
      EXIT;
    END IF;
    v_day := v_day - 1;
    EXIT WHEN v_day < p_end - 400;
  END LOOP;
  RETURN v_streak;
END;
$$;

-- Is this day covered (a run or a protected day)?
CREATE OR REPLACE FUNCTION public.karela_day_covered(p_user uuid, p_day date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.streak_protections WHERE user_id = p_user AND day = p_day)
      OR EXISTS (SELECT 1 FROM public.karela_run_days(p_user, p_day) d WHERE d = p_day)
$$;

-- The streak that counts right now: ends today if today is covered,
-- otherwise yesterday (today can still be saved).
CREATE OR REPLACE FUNCTION public.karela_current_streak(p_user uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN public.karela_day_covered(p_user, public.karela_today())
      THEN public.karela_streak_at(p_user, public.karela_today())
    ELSE public.karela_streak_at(p_user, public.karela_today() - 1)
  END
$$;

/**
 * Uses Streak Freezes for missed days, then recounts the streak and saves it
 * on the profile. The app calls this when it opens and after every run.
 *
 * Freezes are only used when they cover the whole gap. Two missed days with
 * one freeze would lose the streak anyway, so the freeze is kept.
 */
CREATE OR REPLACE FUNCTION public.settle_streak()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_today    date := public.karela_today();
  v_stats    jsonb;
  v_freezes  integer;
  v_last     date;
  v_gap      integer;
  v_used     integer := 0;
  v_streak   integer;
  v_through  date;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT stats INTO v_stats FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  v_freezes := GREATEST(COALESCE((v_stats ->> 'streak_freeze_count')::int, 0), 0);

  -- Last covered day before today.
  SELECT max(d) INTO v_last FROM (
    SELECT d FROM public.karela_run_days(v_uid, v_today - 400) d WHERE d < v_today
    UNION ALL
    SELECT day FROM public.streak_protections WHERE user_id = v_uid AND day < v_today
  ) x;

  IF v_last IS NOT NULL THEN
    v_gap := (v_today - 1) - v_last;  -- missed days up to yesterday
    IF v_gap > 0 AND v_gap <= v_freezes AND public.karela_streak_at(v_uid, v_last) > 0 THEN
      FOR i IN 1 .. v_gap LOOP
        INSERT INTO public.streak_protections (user_id, day, source)
        VALUES (v_uid, v_last + i, 'freeze')
        ON CONFLICT DO NOTHING;
        v_used := v_used + 1;
      END LOOP;
      v_freezes := v_freezes - v_used;
    END IF;
  END IF;

  v_streak := public.karela_current_streak(v_uid);
  SELECT max(day) INTO v_through FROM public.streak_protections WHERE user_id = v_uid;

  UPDATE public.profiles
  SET stats = stats || jsonb_build_object(
    'streak', v_streak,
    'longest_streak', GREATEST(v_streak, COALESCE((stats ->> 'longest_streak')::int, 0)),
    'streak_freeze_count', v_freezes,
    'streak_protected_through', COALESCE(v_through::text, '')
  )
  WHERE id = v_uid;

  RETURN jsonb_build_object(
    'streak', v_streak,
    'freezes_used', v_used,
    'freezes_left', v_freezes,
    'at_risk', v_streak > 0 AND NOT public.karela_day_covered(v_uid, v_today)
  );
END;
$$;

-- ---------- 2. The Shop ----------

CREATE TABLE IF NOT EXISTS public.shop_items (
  id          text PRIMARY KEY,
  category    text NOT NULL CHECK (category IN ('streak', 'boost', 'cosmetic')),
  kind        text NOT NULL CHECK (kind IN ('freeze', 'repair', 'boost', 'guild_boost', 'cosmetic')),
  slot        text CHECK (slot IN ('trail', 'frame')),   -- cosmetics only
  name        text NOT NULL,
  description text NOT NULL,
  price       integer NOT NULL CHECK (price > 0),
  rarity      text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare')),
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,   -- colours, multipliers, hours
  sort        integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users read the shop" ON public.shop_items;
CREATE POLICY "Signed-in users read the shop"
  ON public.shop_items FOR SELECT TO authenticated USING (true);

-- The catalogue. Cosmetics are visual only (aboutkarela.md: no gameplay
-- advantage). Buffs are small, time-limited and reward civic work or the
-- guild, never more running than is healthy.
INSERT INTO public.shop_items (id, category, kind, slot, name, description, price, rarity, value, sort) VALUES
  ('streak_freeze', 'streak', 'freeze', NULL, 'Streak Freeze',
   'Saves your streak on a day you can''t move. Used by itself when you miss a day. Hold up to 2.',
   80, 'common', '{"max_held": 2}', 10),
  ('streak_repair', 'streak', 'repair', NULL, 'Streak Repair',
   'Missed yesterday? Bring your streak back. Only works the day after a single missed day.',
   150, 'common', '{}', 20),
  ('bayanihan_boost', 'boost', 'boost', NULL, 'Bayanihan Boost',
   '+25% XP from civic reports for 24 hours.',
   120, 'common', '{"hours": 24, "civic_xp_multiplier": 1.25}', 30),
  ('trail_aqua', 'cosmetic', 'cosmetic', 'trail', 'Aqua trail',
   'Your run line on the map, in aqua.', 300, 'common', '{"colors": ["#00F5D4"]}', 100),
  ('trail_sky', 'cosmetic', 'cosmetic', 'trail', 'Sky trail',
   'Your run line on the map, in sky blue.', 300, 'common', '{"colors": ["#00BBF9"]}', 110),
  ('trail_teal', 'cosmetic', 'cosmetic', 'trail', 'Teal trail',
   'Your run line on the map, in deep teal.', 300, 'common', '{"colors": ["#209F77"]}', 120),
  ('trail_gold', 'cosmetic', 'cosmetic', 'trail', 'Gold trail',
   'Your run line on the map, in gold.', 600, 'rare', '{"colors": ["#FFD60A"]}', 130),
  ('trail_karela', 'cosmetic', 'cosmetic', 'trail', 'Karela trail',
   'Your run line shifts from lime to aqua to teal as you go.', 600, 'rare',
   '{"colors": ["#7CF205", "#00F5D4", "#209F77"]}', 140),
  ('frame_aqua', 'cosmetic', 'cosmetic', 'frame', 'Aqua frame',
   'An aqua ring around your profile photo.', 300, 'common', '{"colors": ["#00F5D4", "#00BBF9"]}', 200),
  ('frame_ember', 'cosmetic', 'cosmetic', 'frame', 'Ember frame',
   'An orange-to-gold ring around your profile photo.', 300, 'common', '{"colors": ["#FF9F1C", "#FFD60A"]}', 210),
  ('frame_gold', 'cosmetic', 'cosmetic', 'frame', 'Gold frame',
   'A gold ring around your profile photo.', 600, 'rare', '{"colors": ["#FFD60A", "#FFD60A"]}', 220)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category, kind = EXCLUDED.kind, slot = EXCLUDED.slot,
  name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
  rarity = EXCLUDED.rarity, value = EXCLUDED.value, sort = EXCLUDED.sort;

CREATE TABLE IF NOT EXISTS public.user_items (
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  item_id     text NOT NULL REFERENCES public.shop_items (id),
  acquired_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.user_equipped (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  slot    text NOT NULL CHECK (slot IN ('trail', 'frame')),
  item_id text NOT NULL REFERENCES public.shop_items (id),
  PRIMARY KEY (user_id, slot)
);

CREATE TABLE IF NOT EXISTS public.active_boosts (
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  item_id    text NOT NULL REFERENCES public.shop_items (id),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  item_id    text NOT NULL REFERENCES public.shop_items (id),
  price      integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchases_user_idx ON public.purchases (user_id, created_at DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['user_items', 'user_equipped', 'active_boosts', 'purchases'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Users read own rows" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Users read own rows" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;

-- Takes Gems or raises "Not enough Gems". Caller must hold the profile row lock.
CREATE OR REPLACE FUNCTION public.karela_spend_gems(p_user uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gems integer;
BEGIN
  SELECT COALESCE((stats ->> 'gems')::int, 0) INTO v_gems
  FROM public.profiles WHERE id = p_user FOR UPDATE;
  IF v_gems < p_amount THEN
    RAISE EXCEPTION 'Not enough Gems: you have %, this costs %.', v_gems, p_amount
      USING ERRCODE = 'P0001', HINT = 'not_enough_gems';
  END IF;
  UPDATE public.profiles
  SET stats = jsonb_set(stats, '{gems}', to_jsonb(v_gems - p_amount))
  WHERE id = p_user;
  RETURN v_gems - p_amount;
END;
$$;

CREATE OR REPLACE FUNCTION public.buy_item(p_item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_item  public.shop_items;
  v_stats jsonb;
  v_today date := public.karela_today();
  v_gems  integer;
  v_held  integer;
  v_until timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT * INTO v_item FROM public.shop_items WHERE id = p_item_id AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'That item isn''t in the shop.'; END IF;

  -- Lock the profile first so two taps can't both spend the same Gems.
  SELECT stats INTO v_stats FROM public.profiles WHERE id = v_uid FOR UPDATE;

  IF v_item.kind = 'freeze' THEN
    v_held := COALESCE((v_stats ->> 'streak_freeze_count')::int, 0);
    IF v_held >= COALESCE((v_item.value ->> 'max_held')::int, 2) THEN
      RAISE EXCEPTION 'You already hold % Streak Freezes, the most you can keep.', v_held;
    END IF;
    v_gems := public.karela_spend_gems(v_uid, v_item.price);
    UPDATE public.profiles
    SET stats = jsonb_set(stats, '{streak_freeze_count}', to_jsonb(v_held + 1))
    WHERE id = v_uid;

  ELSIF v_item.kind = 'repair' THEN
    -- Exactly one missed day (yesterday), with a streak before it.
    IF public.karela_day_covered(v_uid, v_today - 1) THEN
      RAISE EXCEPTION 'Your streak isn''t broken, so there''s nothing to repair.';
    END IF;
    IF NOT public.karela_day_covered(v_uid, v_today - 2)
       OR public.karela_streak_at(v_uid, v_today - 2) = 0 THEN
      RAISE EXCEPTION 'A repair only works the day after a single missed day.';
    END IF;
    v_gems := public.karela_spend_gems(v_uid, v_item.price);
    INSERT INTO public.streak_protections (user_id, day, source)
    VALUES (v_uid, v_today - 1, 'repair');

  ELSIF v_item.kind = 'boost' THEN
    SELECT expires_at INTO v_until FROM public.active_boosts
    WHERE user_id = v_uid AND item_id = v_item.id AND expires_at > now();
    IF FOUND THEN
      RAISE EXCEPTION 'This boost is already on. You can buy it again when it ends.';
    END IF;
    v_gems := public.karela_spend_gems(v_uid, v_item.price);
    INSERT INTO public.active_boosts (user_id, item_id, expires_at)
    VALUES (v_uid, v_item.id, now() + make_interval(hours => COALESCE((v_item.value ->> 'hours')::int, 24)))
    ON CONFLICT (user_id, item_id) DO UPDATE SET expires_at = EXCLUDED.expires_at;

  ELSIF v_item.kind = 'guild_boost' THEN
    -- Defined in 13_territory.sql (needs guilds).
    v_gems := public.karela_apply_guild_boost(v_uid, v_item);

  ELSIF v_item.kind = 'cosmetic' THEN
    IF EXISTS (SELECT 1 FROM public.user_items WHERE user_id = v_uid AND item_id = v_item.id) THEN
      RAISE EXCEPTION 'You already own this.';
    END IF;
    v_gems := public.karela_spend_gems(v_uid, v_item.price);
    INSERT INTO public.user_items (user_id, item_id) VALUES (v_uid, v_item.id);
    -- Wear it straight away.
    INSERT INTO public.user_equipped (user_id, slot, item_id) VALUES (v_uid, v_item.slot, v_item.id)
    ON CONFLICT (user_id, slot) DO UPDATE SET item_id = EXCLUDED.item_id;
  END IF;

  INSERT INTO public.purchases (user_id, item_id, price) VALUES (v_uid, v_item.id, v_item.price);
  RETURN jsonb_build_object('gems', v_gems, 'item_id', v_item.id);
END;
$$;

-- Wear an owned cosmetic, or pass NULL to go back to the default.
CREATE OR REPLACE FUNCTION public.equip_item(p_slot text, p_item_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_slot NOT IN ('trail', 'frame') THEN RAISE EXCEPTION 'Unknown slot'; END IF;

  IF p_item_id IS NULL THEN
    DELETE FROM public.user_equipped WHERE user_id = v_uid AND slot = p_slot;
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_items ui JOIN public.shop_items si ON si.id = ui.item_id
    WHERE ui.user_id = v_uid AND ui.item_id = p_item_id AND si.slot = p_slot
  ) THEN
    RAISE EXCEPTION 'You don''t own that yet.';
  END IF;
  INSERT INTO public.user_equipped (user_id, slot, item_id) VALUES (v_uid, p_slot, p_item_id)
  ON CONFLICT (user_id, slot) DO UPDATE SET item_id = EXCLUDED.item_id;
END;
$$;

-- Everything the Shop screen needs in one call.
CREATE OR REPLACE FUNCTION public.get_shop_state()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_today date := public.karela_today();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  RETURN jsonb_build_object(
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(si) ORDER BY si.sort) FROM public.shop_items si WHERE si.active), '[]'),
    'owned', COALESCE((SELECT jsonb_agg(item_id) FROM public.user_items WHERE user_id = v_uid), '[]'),
    'equipped', COALESCE((SELECT jsonb_object_agg(slot, item_id) FROM public.user_equipped WHERE user_id = v_uid), '{}'),
    'boosts', COALESCE((SELECT jsonb_object_agg(item_id, expires_at) FROM public.active_boosts
                        WHERE user_id = v_uid AND expires_at > now()), '{}'),
    'repair_available', NOT public.karela_day_covered(v_uid, v_today - 1)
                        AND public.karela_day_covered(v_uid, v_today - 2)
                        AND public.karela_streak_at(v_uid, v_today - 2) > 0,
    'repair_streak', public.karela_streak_at(v_uid, v_today - 2)
  );
END;
$$;

-- ---------- Permissions ----------

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.settle_streak()', 'public.buy_item(text)', 'public.equip_item(text, text)',
    'public.get_shop_state()'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
  -- Internal helpers: not callable from the app.
  FOREACH f IN ARRAY ARRAY[
    'public.karela_run_days(uuid, date)', 'public.karela_streak_at(uuid, date)',
    'public.karela_day_covered(uuid, date)', 'public.karela_current_streak(uuid)',
    'public.karela_spend_gems(uuid, integer)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;

-- ============================================================
-- CHECKS (run one at a time)
-- 1. The catalogue:   SELECT id, price FROM public.shop_items ORDER BY sort;
-- 2. In the app: open Shop, buy a Streak Freeze with test Gems; your Gems
--    drop by 80 and "Freezes 1 of 2" shows. Buying a third is refused.
-- ============================================================

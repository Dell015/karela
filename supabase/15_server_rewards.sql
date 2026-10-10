-- ============================================================
-- KARELA SUPABASE - 15: Rewards are decided by the server (QA C1, H2, H3)
-- Run in the Supabase SQL Editor AFTER 14_finish_run.sql.
-- Needs 07 (stats), 10 (streaks), 11 to 13 (buffs) and 03 (civic).
--
-- Before this file the phone worked out XP and Gems and added them with
-- increment_stats / set_stats, so a modified app could give itself any
-- amount. After it:
--
--   runs          finish_run() works out XP, Gems, calories, the streak and
--                 quest progress from the distance and time
--   quests        claim_mission() checks the goal and pays once; new quests
--                 get their XP from the server, and only the server moves
--                 their progress
--   first week    claim_mission() pays the onboarding Gems and moves to the
--                 next day (H3)
--   civic         submit_civic_report() pays the report reward itself and
--                 always uses the 25 m radius (part of C4)
--   reset         reset_my_progress() replaces the phone's reset
--   lock          increment_stats can't be called by the app any more;
--                 set_stats only takes body details, Ani notes and quest
--                 dates
--
-- Every number is in karela_reward_rules(), taken from the app as it was
-- (services/runMath.ts, gemSystem.ts, QuestEngine.ts, onboarding.ts,
-- app/drawer/maps.tsx). Change them there.
--
-- Still open: the distance itself still comes from the phone (H4), and
-- civic rewards are still paid when a report is sent, not when it's
-- confirmed (C4, owner decision).
--
-- Safe to run more than once.
-- ============================================================

-- ---------- 0. The numbers ----------

CREATE OR REPLACE FUNCTION public.karela_reward_rules()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'meters_per_xp', 10,            -- runMath.xpFor: 1 XP per 10 m
    'sector_meters', 500,           -- gemSystem.getTotalSectors
    'sector_gems', 5,               -- GEM_EARNINGS.SECTOR_BONUS
    'max_run_kmh', 35,              -- useLocationEngine VELOCITY_CAP: faster is a vehicle
    'default_weight_kg', 70,        -- runMath.caloriesFor
    'civic_report', jsonb_build_object('xp', 50, 'gems', 5),
    'civic_verified', jsonb_build_object('xp', 200, 'gems', 20),
    'civic_radius_m', 25,
    -- QuestEngine.scaleXP: base by frequency, +10% per level above 1,
    -- times up to 1.3 by type (civic). Quests above this are cut down.
    'quest_base_xp', jsonb_build_object('daily', 100, 'weekly', 300, 'monthly', 750, 'limited', 200),
    'quest_xp_per_level', 0.1,
    'quest_type_max', 1.3,
    'quest_gems', jsonb_build_object('civic', 10, 'weekly', 5, 'monthly', 15),
    'quest_min_target', jsonb_build_object('distance', 0.5, 'speed', 0.5, 'civic', 1, 'streak', 1),
    -- New quests per day / week / month. The app makes 2 a day, 2 a week
    -- and 1 a month; the rest is room for retries after a failed load.
    'quest_max_new', jsonb_build_object('daily', 6, 'weekly', 4, 'monthly', 2, 'limited', 2),
    -- services/onboarding.ts ONBOARDING_ARC, days 1 to 7
    'onboarding', jsonb_build_array(
      jsonb_build_object('target', 0.5, 'type', 'distance', 'xp', 100, 'gems', 20),
      jsonb_build_object('target', 1.0, 'type', 'distance', 'xp', 150, 'gems', 15),
      jsonb_build_object('target', 1.0, 'type', 'distance', 'xp', 150, 'gems', 15),
      jsonb_build_object('target', 1,   'type', 'civic',    'xp', 200, 'gems', 30),
      jsonb_build_object('target', 1.0, 'type', 'distance', 'xp', 150, 'gems', 15),
      jsonb_build_object('target', 1.5, 'type', 'distance', 'xp', 200, 'gems', 25),
      jsonb_build_object('target', 2.0, 'type', 'distance', 'xp', 300, 'gems', 50))
  )
$$;

-- services/streakMultiplier.ts
CREATE OR REPLACE FUNCTION public.karela_streak_multiplier(p_streak integer)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_streak >= 30 THEN 3.0
    WHEN p_streak >= 14 THEN 2.0
    WHEN p_streak >= 7  THEN 1.5
    WHEN p_streak >= 4  THEN 1.2
    ELSE 1.0
  END
$$;

-- ---------- 1. Paying out ----------

/**
 * Adds XP and Gems and levels up (1,000 XP a level, as the app did).
 * Amounts are final: multipliers are applied by the caller.
 */
CREATE OR REPLACE FUNCTION public.karela_award(p_user uuid, p_xp integer, p_gems integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_stats jsonb;
  v_total bigint;
BEGIN
  SELECT stats INTO v_stats FROM public.profiles WHERE id = p_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  v_total := public.karela_total_xp(v_stats) + GREATEST(COALESCE(p_xp, 0), 0);
  UPDATE public.profiles
  SET stats = stats || jsonb_build_object(
    'level', v_total / 1000 + 1,
    'xp', v_total % 1000,
    'gems', COALESCE((stats ->> 'gems')::int, 0) + GREATEST(COALESCE(p_gems, 0), 0)
  )
  WHERE id = p_user;
END;
$$;

/**
 * XP after the streak tier and the guild's Pioneer badge, the same order
 * the app used: round(floor(raw x streak) x guild).
 */
CREATE OR REPLACE FUNCTION public.karela_boosted_xp(p_user uuid, p_raw numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_streak integer := COALESCE((SELECT (stats ->> 'streak')::int FROM public.profiles WHERE id = p_user), 0);
BEGIN
  IF p_raw IS NULL OR p_raw <= 0 THEN RETURN 0; END IF;
  RETURN round(floor(p_raw * public.karela_streak_multiplier(v_streak))
               * COALESCE((public.get_my_buffs() ->> 'xp_multiplier')::numeric, 1))::int;
END;
$$;

CREATE OR REPLACE FUNCTION public.karela_boosted_gems(p_raw numeric)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE WHEN COALESCE(p_raw, 0) <= 0 THEN 0
    ELSE round(p_raw * COALESCE((public.get_my_buffs() ->> 'gem_multiplier')::numeric, 1))::int END
$$;

-- ---------- 2. Runs ----------

-- last_active_date was written by the phone; never fail on a bad value.
CREATE OR REPLACE FUNCTION public.karela_try_timestamptz(p text)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN p::timestamptz;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

DROP FUNCTION IF EXISTS public.finish_run(uuid, numeric, numeric, numeric, integer, timestamptz);

/**
 * Saves a run once (by the UUID the phone gave it) and pays for it.
 * p_calories and p_xp are ignored: older apps send them, the server works
 * them out. Returns {saved: false} for a run it already has.
 */
CREATE OR REPLACE FUNCTION public.finish_run(
  p_id          uuid,
  p_meters      numeric,
  p_seconds     numeric,
  p_calories    numeric DEFAULT NULL,
  p_xp          integer DEFAULT NULL,
  p_finished_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_rules   jsonb := public.karela_reward_rules();
  v_at      timestamptz := least(COALESCE(p_finished_at, now()), now());
  v_seconds numeric;
  v_meters  numeric;
  v_km      numeric;
  v_weight  numeric;
  v_kcal    integer;
  v_xp      integer;
  v_gems    integer;
  v_stats   jsonb;
  inserted  int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to save your run.'; END IF;
  IF p_id IS NULL THEN RAISE EXCEPTION 'This run has no id. Update the app and try again.'; END IF;
  IF p_meters IS NULL OR p_meters < 0 OR p_seconds IS NULL OR p_seconds < 0 THEN
    RAISE EXCEPTION 'This run has impossible numbers, so it wasn''t saved.';
  END IF;

  -- Distance faster than a vehicle isn't counted.
  v_seconds := floor(p_seconds);
  v_meters := floor(least(p_meters, v_seconds * (v_rules ->> 'max_run_kmh')::numeric / 3.6));
  v_km := round(v_meters / 1000.0, 2);

  SELECT stats INTO v_stats FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  v_weight := (v_stats ->> 'weight')::numeric;
  IF v_weight IS NULL OR v_weight < 20 OR v_weight > 300 THEN
    v_weight := (v_rules ->> 'default_weight_kg')::numeric;
  END IF;
  v_kcal := round(v_meters / 1000.0 * v_weight);

  INSERT INTO public.run_history (id, user_id, distance_meters, duration_seconds, calories, xp_earned, completed_at)
  VALUES (p_id, v_uid, v_meters, v_seconds, v_kcal, 0, v_at)
  ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted = 0 THEN
    RETURN jsonb_build_object('saved', false);
  END IF;

  UPDATE public.profiles
  SET stats = stats || jsonb_build_object(
    'total_distance_km', COALESCE((stats ->> 'total_distance_km')::numeric, 0) + v_km,
    'total_calories_burned', COALESCE((stats ->> 'total_calories_burned')::numeric, 0) + v_kcal,
    'last_active_date', to_jsonb(GREATEST(
      COALESCE(public.karela_try_timestamptz(stats ->> 'last_active_date'), v_at), v_at))
  )
  WHERE id = v_uid;

  -- The streak first, so this run's day counts toward the multiplier.
  PERFORM public.settle_streak();

  v_xp := public.karela_boosted_xp(v_uid, floor(v_meters / (v_rules ->> 'meters_per_xp')::numeric));
  v_gems := public.karela_boosted_gems(
    floor(v_meters / (v_rules ->> 'sector_meters')::numeric) * (v_rules ->> 'sector_gems')::numeric);
  PERFORM public.karela_award(v_uid, v_xp, v_gems);
  UPDATE public.run_history SET xp_earned = v_xp WHERE id = p_id;

  -- Quest progress: km for distance and speed quests, one run for streak quests.
  UPDATE public.missions
  SET current_value = round(COALESCE(current_value, 0)
        + CASE WHEN type = 'streak' THEN 1 ELSE v_km END, 2)
  WHERE user_id = v_uid AND status = 'active' AND type IN ('distance', 'speed', 'streak');

  RETURN jsonb_build_object(
    'saved', true,
    'meters', v_meters,
    'calories', v_kcal,
    'xp', v_xp,
    'gems', v_gems,
    'streak', (SELECT (stats ->> 'streak')::int FROM public.profiles WHERE id = v_uid)
  );
END;
$$;

-- ---------- 3. Quests ----------

ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS onboarding_day integer;

-- Highest XP a quest can carry, for this frequency at this level.
CREATE OR REPLACE FUNCTION public.karela_quest_xp_cap(p_frequency text, p_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT floor(
    COALESCE((public.karela_reward_rules() -> 'quest_base_xp' ->> p_frequency)::numeric, 100)
    * (1 + GREATEST(COALESCE(p_level, 1) - 1, 0) * (public.karela_reward_rules() ->> 'quest_xp_per_level')::numeric)
    * (public.karela_reward_rules() ->> 'quest_type_max')::numeric)::int
$$;

/**
 * New quests from the app: progress starts at 0, XP is capped (or set, for
 * first-week quests), targets have a floor, and there's a limit per period.
 * Writes from the server's own functions skip this. Runs as the caller
 * (not SECURITY DEFINER), so current_user tells the app from the server.
 */
CREATE OR REPLACE FUNCTION public.karela_on_mission_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_rules jsonb := public.karela_reward_rules();
  v_stats jsonb;
  v_day   jsonb;
  v_since timestamptz;
  v_count integer;
  v_today date := public.karela_today();
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN RETURN NEW; END IF;

  SELECT stats INTO v_stats FROM public.profiles WHERE id = NEW.user_id;
  NEW.current_value := 0;
  NEW.status := 'active';
  NEW.created_at := now();
  NEW.frequency := COALESCE(NEW.frequency, 'daily');
  IF NEW.frequency NOT IN ('daily', 'weekly', 'monthly', 'limited') THEN NEW.frequency := 'daily'; END IF;

  IF NEW.onboarding_day IS NOT NULL THEN
    IF NEW.onboarding_day <> COALESCE((v_stats ->> 'onboarding_day_completed')::int, 0) + 1
       OR NEW.onboarding_day > jsonb_array_length(v_rules -> 'onboarding') THEN
      RAISE EXCEPTION 'That first-week quest isn''t next.';
    END IF;
    v_day := v_rules -> 'onboarding' -> (NEW.onboarding_day - 1);
    NEW.target_value := (v_day ->> 'target')::numeric;
    NEW.type := v_day ->> 'type';
    NEW.xp_reward := (v_day ->> 'xp')::int;
    NEW.frequency := 'daily';
  ELSE
    NEW.xp_reward := LEAST(GREATEST(COALESCE(NEW.xp_reward, 0), 0),
                           public.karela_quest_xp_cap(NEW.frequency, COALESCE((v_stats ->> 'level')::int, 1)));
    NEW.target_value := GREATEST(COALESCE(NEW.target_value, 0),
                                 COALESCE((v_rules -> 'quest_min_target' ->> NEW.type)::numeric, 1));
  END IF;

  v_since := (CASE NEW.frequency
    WHEN 'weekly'  THEN date_trunc('week', v_today::timestamp)
    WHEN 'monthly' THEN date_trunc('month', v_today::timestamp)
    ELSE v_today::timestamp
  END) AT TIME ZONE 'Asia/Manila';
  SELECT count(*) INTO v_count FROM public.missions
  WHERE user_id = NEW.user_id AND frequency = NEW.frequency AND created_at >= v_since;
  IF v_count >= COALESCE((v_rules -> 'quest_max_new' ->> NEW.frequency)::int, 2) THEN
    RAISE EXCEPTION 'You already have enough % quests for now.', NEW.frequency;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS karela_mission_insert ON public.missions;
CREATE TRIGGER karela_mission_insert BEFORE INSERT ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.karela_on_mission_insert();

-- The app may only expire an active quest. Progress and claims are the server's.
REVOKE UPDATE ON public.missions FROM anon, authenticated;
GRANT UPDATE (status) ON public.missions TO authenticated;

CREATE OR REPLACE FUNCTION public.karela_on_mission_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon')
     AND NOT (OLD.status = 'active' AND NEW.status = 'expired') THEN
    RAISE EXCEPTION 'Quests can only be expired from the app.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS karela_mission_update ON public.missions;
CREATE TRIGGER karela_mission_update BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.karela_on_mission_update();

/**
 * Claims a finished quest: checks the goal, marks it claimed and pays, all
 * at once, so a double tap pays once. Returns {xp, gems, onboarding_day}.
 */
CREATE OR REPLACE FUNCTION public.claim_mission(p_mission uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid   uuid := public.karela_require_user();
  v_rules jsonb := public.karela_reward_rules();
  v_m     public.missions;
  v_done  integer;
  v_xp    integer;
  v_gems  integer := 0;
BEGIN
  SELECT * INTO v_m FROM public.missions WHERE id = p_mission AND user_id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quest not found.'; END IF;
  IF v_m.status <> 'active' THEN RAISE EXCEPTION 'This quest was already claimed or has ended.'; END IF;
  IF COALESCE(v_m.target_value, 0) <= 0 OR COALESCE(v_m.current_value, 0) < v_m.target_value THEN
    RAISE EXCEPTION 'Finish the quest goal first, then claim your reward.';
  END IF;

  IF v_m.onboarding_day IS NOT NULL THEN
    v_done := COALESCE((SELECT (stats ->> 'onboarding_day_completed')::int FROM public.profiles WHERE id = v_uid), 0);
    IF v_m.onboarding_day <> v_done + 1 THEN
      RAISE EXCEPTION 'You already finished that first-week day.';
    END IF;
    v_gems := (v_rules -> 'onboarding' -> (v_m.onboarding_day - 1) ->> 'gems')::int;
    UPDATE public.profiles
    SET stats = stats || jsonb_build_object('onboarding_day_completed', v_m.onboarding_day)
    WHERE id = v_uid;
  ELSE
    IF v_m.type = 'civic' THEN v_gems := v_gems + (v_rules -> 'quest_gems' ->> 'civic')::int; END IF;
    IF v_m.frequency IN ('weekly', 'monthly') THEN
      v_gems := v_gems + (v_rules -> 'quest_gems' ->> v_m.frequency)::int;
    END IF;
  END IF;

  -- Streak tier, then the guild's Pioneer badge, like every other XP
  -- (owner decision 2026-10-11; before, quests skipped the badge).
  v_xp := round(floor(COALESCE(v_m.xp_reward, 0) * public.karela_streak_multiplier(public.karela_current_streak(v_uid)))
                * COALESCE((public.get_my_buffs() ->> 'xp_multiplier')::numeric, 1))::int;

  UPDATE public.missions SET status = 'claimed' WHERE id = p_mission;
  PERFORM public.karela_award(v_uid, v_xp, v_gems);
  UPDATE public.profiles
  SET stats = stats || jsonb_build_object(
    'total_missions_completed', COALESCE((stats ->> 'total_missions_completed')::int, 0) + 1)
  WHERE id = v_uid;

  RETURN jsonb_build_object('xp', v_xp, 'gems', v_gems, 'onboarding_day', v_m.onboarding_day);
END;
$$;

-- ---------- 4. Civic reports ----------

/**
 * The reward for a report the server just accepted: XP (with the Bayanihan
 * Boost, streak tier and guild badge, in the app's order), Gems, and +1 on
 * civic quests. Returns {xp, gems}.
 */
CREATE OR REPLACE FUNCTION public.karela_civic_reward(p_user uuid, p_verified boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base jsonb := public.karela_reward_rules() -> (CASE WHEN p_verified THEN 'civic_verified' ELSE 'civic_report' END);
  v_raw  numeric;
  v_xp   integer;
  v_gems integer;
BEGIN
  v_raw := round((v_base ->> 'xp')::numeric
                 * COALESCE((public.get_my_buffs() ->> 'civic_xp_multiplier')::numeric, 1));
  v_xp := public.karela_boosted_xp(p_user, v_raw);
  v_gems := public.karela_boosted_gems((v_base ->> 'gems')::numeric);
  PERFORM public.karela_award(p_user, v_xp, v_gems);
  UPDATE public.missions SET current_value = COALESCE(current_value, 0) + 1
  WHERE user_id = p_user AND status = 'active' AND type = 'civic';
  RETURN jsonb_build_object('xp', v_xp, 'gems', v_gems);
END;
$$;

-- [postgis] (tests/t15.mjs skips from here to [/postgis]: no PostGIS there)
-- Same as 03_civic_engine.sql, except: the radius is always the server's
-- (p_epsilon_meters is ignored), and an accepted report is paid here.
CREATE OR REPLACE FUNCTION public.submit_civic_report(
  p_user_id UUID,
  p_latitude FLOAT,
  p_longitude FLOAT,
  p_category TEXT,
  p_photo_url TEXT DEFAULT NULL,
  p_device_heading FLOAT DEFAULT NULL,
  p_epsilon_meters FLOAT DEFAULT 25.0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_radius FLOAT := (public.karela_reward_rules() ->> 'civic_radius_m')::float;
  v_point GEOGRAPHY;
  v_existing_node_id UUID;
  v_new_node_id UUID;
  v_report_id UUID;
  v_consensus BOOLEAN;
  v_decay FLOAT;
  v_reward JSONB;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;

  IF EXISTS (
    SELECT 1 FROM public.civic_reports
    WHERE user_id = p_user_id
      AND category = p_category
      AND ST_DWithin(location, v_point, v_radius)
      AND created_at::DATE = CURRENT_DATE
  ) THEN
    RETURN json_build_object('error', 'duplicate_report', 'message', 'You already reported this area today.');
  END IF;

  SELECT id INTO v_existing_node_id
  FROM public.civic_nodes
  WHERE category = p_category
    AND status IN ('pending', 'verified')
    AND ST_DWithin(location, v_point, v_radius)
  ORDER BY ST_Distance(location, v_point)
  LIMIT 1;

  v_decay := CASE p_category
    WHEN 'trash' THEN 0.15
    WHEN 'flooding' THEN 0.08
    WHEN 'drain_blockage' THEN 0.08
    WHEN 'damaged_infrastructure' THEN 0.03
    WHEN 'unsafe_area' THEN 0.05
    ELSE 0.1
  END;

  IF v_existing_node_id IS NOT NULL THEN
    v_new_node_id := v_existing_node_id;
    UPDATE public.civic_nodes
    SET last_confirmed = now(),
        confidence = 1.0
    WHERE id = v_existing_node_id AND status = 'verified';
  ELSE
    INSERT INTO public.civic_nodes (location, category, status, decay_rate, created_by)
    VALUES (v_point, p_category, 'pending', v_decay, p_user_id)
    RETURNING id INTO v_new_node_id;
  END IF;

  INSERT INTO public.civic_reports (user_id, node_id, location, category, photo_url, device_heading)
  VALUES (p_user_id, v_new_node_id, v_point, p_category, p_photo_url, p_device_heading)
  RETURNING id INTO v_report_id;

  v_consensus := check_spatial_consensus(v_new_node_id, v_radius);
  v_reward := public.karela_civic_reward(p_user_id, COALESCE(v_consensus, false));

  RETURN json_build_object(
    'success', true,
    'report_id', v_report_id,
    'node_id', v_new_node_id,
    'consensus_reached', v_consensus,
    'node_status', (SELECT status FROM public.civic_nodes WHERE id = v_new_node_id),
    'reward', v_reward
  );
END;
$$;

-- [/postgis]

-- ---------- 5. Reset progress (Settings) ----------

/**
 * Starts the running side over, as the Settings screen describes: run
 * history, Ani's run notes, level, XP, distance and streak. Gems, Streak
 * Freezes, quests and civic reports are kept.
 */
CREATE OR REPLACE FUNCTION public.reset_my_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := public.karela_require_user();
BEGIN
  DELETE FROM public.run_history WHERE user_id = v_uid;
  DELETE FROM public.run_summaries WHERE user_id = v_uid;
  UPDATE public.profiles
  SET stats = stats || jsonb_build_object(
    'level', 1, 'xp', 0, 'ghostWins', 0, 'streak', 0, 'longest_streak', 0,
    'total_distance_km', 0, 'total_calories_burned', 0, 'avg_pace_mins_km', 0,
    'fitness_score', 1.0)
  WHERE id = v_uid;
END;
$$;

-- ---------- 6. Lock the stats ----------

-- Only these keys can be set by the app. Everything that is earned
-- (XP, level, Gems, streaks, totals, first-week progress) is the server's.
CREATE OR REPLACE FUNCTION public.set_stats(p_user_id uuid, p_values jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_allowed text[] := ARRAY[
    'age', 'weight', 'height', 'bmi', 'target_weight', 'ai_notes',
    'last_daily_reset', 'last_weekly_reset', 'last_monthly_reset', 'onboarding_last_assigned'];
  v_bad text;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to modify this profile';
  END IF;
  SELECT k INTO v_bad FROM jsonb_object_keys(COALESCE(p_values, '{}'::jsonb)) k
  WHERE NOT (k = ANY (v_allowed)) LIMIT 1;
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'Only the server can change %.', v_bad;
  END IF;

  UPDATE public.profiles
  SET stats = stats || p_values
  WHERE id = p_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.increment_stats(uuid, jsonb) FROM PUBLIC, anon, authenticated;

-- Profiles that went past 1,000 XP before levels were counted here.
UPDATE public.profiles
SET stats = stats || jsonb_build_object(
  'level', public.karela_total_xp(stats) / 1000 + 1,
  'xp', public.karela_total_xp(stats) % 1000)
WHERE COALESCE((stats ->> 'xp')::numeric, 0) >= 1000;

-- ---------- Permissions ----------

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.finish_run(uuid, numeric, numeric, numeric, integer, timestamptz)',
    'public.claim_mission(uuid)',
    'public.reset_my_progress()'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY[
    'public.karela_award(uuid, integer, integer)',
    'public.karela_boosted_xp(uuid, numeric)',
    'public.karela_boosted_gems(numeric)',
    'public.karela_civic_reward(uuid, boolean)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END $$;

-- ---------- Checks (run after the file) ----------
-- Should be false, true, true:
--   SELECT has_function_privilege('authenticated', 'public.increment_stats(uuid,jsonb)', 'EXECUTE'),
--          has_function_privilege('authenticated', 'public.claim_mission(uuid)', 'EXECUTE'),
--          has_function_privilege('authenticated', 'public.finish_run(uuid,numeric,numeric,numeric,integer,timestamptz)', 'EXECUTE');

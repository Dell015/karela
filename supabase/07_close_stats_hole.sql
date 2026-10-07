-- ============================================================
-- KARELA SUPABASE - 07: Close the stats and profile holes (urgent)
-- Run in the Supabase SQL Editor AFTER 06_schedule_decay.sql.
--
-- Problems found on 2026-10-08:
--
-- A. increment_stats() and set_stats() check "auth.uid() <> p_user_id".
--    For a logged-out caller auth.uid() is NULL, and "NULL <> id" is not
--    true, so the check never fires. Both functions were executable by
--    anon (the public key shipped inside the app). Anyone could change or
--    wipe ANY user's XP, Gems, level or streak without logging in.
--    (Same NULL trap that 05 fixed for the civic functions.)
--
-- B. handle_new_user() copied the "stats" sent at sign-up straight into
--    the new profile, so a modified app could start with any XP or Gems.
--
-- C. The profiles UPDATE policy let a user change any column of their own
--    row, including is_verified.
--
-- This migration closes A, B and C without changing how the app works.
--
-- Still open after this (next migration): a logged-in user can still
-- raise their OWN XP and Gems through increment_stats/set_stats, because
-- the app awards rewards from the phone. Fixing that means moving every
-- reward (runs, reports, quests) into server functions.
--
-- Safe to run more than once.
-- ============================================================

-- ---------- A. Stats functions: NULL-safe owner check, no anon ----------

CREATE OR REPLACE FUNCTION public.increment_stats(p_user_id uuid, p_deltas jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  k text;
  v numeric;
  current_val numeric;
  new_val     numeric;
BEGIN
  -- IS DISTINCT FROM treats NULL (logged out) as different: always raises.
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to modify this profile';
  END IF;

  FOR k, v IN SELECT key, value::numeric FROM jsonb_each_text(p_deltas)
  LOOP
    current_val := COALESCE((
      SELECT (stats ->> k)::numeric FROM public.profiles WHERE id = p_user_id
    ), 0);

    new_val := current_val + v;

    -- XP can never go below 0
    IF k = 'xp' THEN
      new_val := GREATEST(0, new_val);
    END IF;

    UPDATE public.profiles
    SET stats = jsonb_set(stats, ARRAY[k], to_jsonb(new_val))
    WHERE id = p_user_id;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_stats(p_user_id uuid, p_values jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to modify this profile';
  END IF;

  UPDATE public.profiles
  SET stats = stats || p_values
  WHERE id = p_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.increment_stats(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_stats(uuid, jsonb)       FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.increment_stats(uuid, jsonb) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.set_stats(uuid, jsonb)       TO authenticated;

-- ---------- B. New accounts: only body measurements come from the phone ----------
-- Everything game-related (XP, level, Gems, streak) starts at zero on the
-- server. Measurements outside a sane range are dropped (the app falls back
-- to its defaults).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  m jsonb := COALESCE(new.raw_user_meta_data -> 'stats', '{}'::jsonb);
  v_weight numeric;
  v_height numeric;
  v_age    numeric;
  v_body   jsonb := '{}'::jsonb;
BEGIN
  -- Read numbers defensively: a non-numeric value becomes NULL, not an error.
  v_weight := CASE WHEN (m ->> 'weight') ~ '^[0-9]+(\.[0-9]+)?$' THEN (m ->> 'weight')::numeric END;
  v_height := CASE WHEN (m ->> 'height') ~ '^[0-9]+(\.[0-9]+)?$' THEN (m ->> 'height')::numeric END;
  v_age    := CASE WHEN (m ->> 'age')    ~ '^[0-9]+$'             THEN (m ->> 'age')::numeric    END;

  IF v_weight BETWEEN 20 AND 300 THEN
    v_body := v_body || jsonb_build_object('weight', v_weight, 'target_weight', v_weight);
  END IF;
  IF v_height BETWEEN 100 AND 250 THEN
    v_body := v_body || jsonb_build_object('height', v_height);
  END IF;
  IF v_age BETWEEN 10 AND 100 THEN
    v_body := v_body || jsonb_build_object('age', v_age);
  END IF;
  IF v_body ? 'weight' AND v_body ? 'height' THEN
    v_body := v_body || jsonb_build_object(
      'bmi', round(v_weight / ((v_height / 100) * (v_height / 100)), 2)
    );
  END IF;

  INSERT INTO public.profiles (id, email, display_name, username, stats, settings)
  VALUES (
    new.id,
    new.email,
    left(COALESCE(new.raw_user_meta_data ->> 'display_name', 'New Strider'), 60),
    left(COALESCE(new.raw_user_meta_data ->> 'username', 'Strider_' || substr(new.id::text, 1, 4)), 30),
    jsonb_build_object(
      'level', 1, 'xp', 0, 'gems', 0,
      'streak', 0, 'longest_streak', 0, 'streak_freeze_count', 0,
      'fitness_score', 1.0,
      'total_distance_km', 0, 'total_calories_burned', 0,
      'total_missions_completed', 0, 'avg_pace_mins_km', 0
    ) || v_body,
    '{"units":"metric","notifications":true}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$;

-- A trigger function is never meant to be called directly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ---------- C. Profiles: users may only edit their own public fields ----------
-- Table privileges sit under the RLS policies: RLS still limits each user to
-- their own row, and now the columns they can change are listed explicitly.
-- stats (XP, Gems, level, streak) can only change through the functions above.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, username, profile_picture, settings) ON public.profiles TO authenticated;

-- ============================================================
-- CHECKS. Run these one at a time after the migration.
-- ============================================================

-- 1. anon can no longer run the stats functions (both should be false):
--    SELECT has_function_privilege('anon', 'public.increment_stats(uuid,jsonb)', 'EXECUTE') AS inc,
--           has_function_privilege('anon', 'public.set_stats(uuid,jsonb)', 'EXECUTE')       AS set;

-- 2. Which profile columns a logged-in user may change (expect 4 rows):
--    SELECT column_name FROM information_schema.column_privileges
--    WHERE table_schema = 'public' AND table_name = 'profiles'
--      AND grantee = 'authenticated' AND privilege_type = 'UPDATE';

-- 3. In the app: sign up a test account, finish a short run, edit your
--    name in Profile. All three should still work.

-- ============================================================
-- KARELA SUPABASE - 14: Finish a run exactly once
-- Run in the Supabase SQL Editor AFTER 13_territory.sql.
--
-- The phone now keeps every run in an outbox (services/runOutbox.ts) and
-- gives it a UUID when it starts. When the run is sent, finish_run() saves
-- it to run_history under that UUID and adds its distance and calories to
-- the profile, in one transaction. Sending the same run again (a retry
-- after a dropped connection) changes nothing and returns false.
--
-- Without this file the app still works: it inserts into run_history with
-- the same UUID itself, so a run is never stored twice, but the distance
-- total is a separate call that a lost reply could repeat.
--
-- Still open (QA_REPORT C1): XP is still worked out on the phone and
-- passed in. The next step is to compute it here and stop the app from
-- calling increment_stats / set_stats.
--
-- Safe to run more than once.
-- ============================================================

CREATE OR REPLACE FUNCTION public.finish_run(
  p_id          uuid,
  p_meters      numeric,
  p_seconds     numeric,
  p_calories    numeric,
  p_xp          integer,
  p_finished_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid      uuid := auth.uid();
  inserted int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to save your run.';
  END IF;
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'This run has no id. Update the app and try again.';
  END IF;
  IF p_meters IS NULL OR p_meters < 0 OR p_seconds IS NULL OR p_seconds < 0
     OR coalesce(p_calories, 0) < 0 OR coalesce(p_xp, 0) < 0 THEN
    RAISE EXCEPTION 'This run has impossible numbers, so it wasn''t saved.';
  END IF;

  -- A phone clock that runs fast can't put a run in the future.
  INSERT INTO public.run_history
    (id, user_id, distance_meters, duration_seconds, calories, xp_earned, completed_at)
  VALUES
    (p_id, uid, floor(p_meters), floor(p_seconds), coalesce(p_calories, 0), coalesce(p_xp, 0),
     least(coalesce(p_finished_at, now()), now()))
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted = 0 THEN
    RETURN false; -- already saved (by this user, or the id is taken)
  END IF;

  -- Same rounding the app used: km to 2 decimals.
  UPDATE public.profiles
  SET stats = stats
    || jsonb_build_object(
         'total_distance_km',
         coalesce((stats ->> 'total_distance_km')::numeric, 0) + round(floor(p_meters) / 1000.0, 2),
         'total_calories_burned',
         coalesce((stats ->> 'total_calories_burned')::numeric, 0) + coalesce(p_calories, 0))
  WHERE id = uid;

  RETURN true;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.finish_run(uuid, numeric, numeric, numeric, integer, timestamptz) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.finish_run(uuid, numeric, numeric, numeric, integer, timestamptz) TO authenticated;

-- ---------- Checks (run after the file) ----------
-- Should be true, false:
--   SELECT has_function_privilege('authenticated', 'public.finish_run(uuid,numeric,numeric,numeric,integer,timestamptz)', 'EXECUTE'),
--          has_function_privilege('anon',          'public.finish_run(uuid,numeric,numeric,numeric,integer,timestamptz)', 'EXECUTE');

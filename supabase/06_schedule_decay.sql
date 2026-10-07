-- ============================================================
-- KARELA SUPABASE - 06: Schedule temporal decay (fixes QA item C8)
-- Run in the Supabase SQL Editor AFTER 05_lock_down_civic.sql.
--
-- Problem: apply_temporal_decay() existed but nothing ever ran it.
-- Verified nodes stayed verified forever and pending nodes never
-- expired, so the map filled up with stale reports.
--
-- Fix: run it every hour inside the database with pg_cron.
-- The job runs as postgres, which still has EXECUTE on the function
-- after 05 (05 only took it away from anon and authenticated).
--
-- Running it hourly is safe: the function recomputes confidence from
-- the last confirmation time each run, so it never decays twice.
--
-- Safe to run more than once (scheduling the same job name again
-- updates the existing job instead of adding a second one).
-- ============================================================

-- 1. Turn on pg_cron (Supabase installs it into pg_catalog).
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 2. Run decay at minute 0 of every hour.
SELECT cron.schedule(
  'karela-civic-decay',
  '0 * * * *',
  $$SELECT public.apply_temporal_decay();$$
);

-- ============================================================
-- CHECKS. Run these one at a time after the migration.
-- ============================================================

-- A. The job exists and is active:
--    SELECT jobid, jobname, schedule, command, active
--    FROM cron.job WHERE jobname = 'karela-civic-decay';

-- B. After the next full hour, the job ran without errors:
--    SELECT status, return_message, start_time, end_time
--    FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'karela-civic-decay')
--    ORDER BY start_time DESC LIMIT 5;
--    status should be 'succeeded'.

-- To stop the job later:
--    SELECT cron.unschedule('karela-civic-decay');

-- ============================================================
-- KARELA SUPABASE - 05: Lock down the civic tables (fixes QA item C2)
-- Run in the Supabase SQL Editor AFTER 04_civic_fixes_and_storage.sql.
--
-- Problem: civic_nodes had an UPDATE policy of USING (true) and an INSERT
-- policy for any logged-in user. With the public anon key plus a login,
-- anyone could mark a node 'verified', move it, or insert a node that is
-- already verified. That breaks the "3 independent people" rule.
--
-- The app never writes these tables directly. It only calls these
-- functions: submit_civic_report, get_nearby_nodes, reconfirm_civic_node.
-- They are SECURITY DEFINER, so they keep working after this migration.
--
-- Safe to run more than once.
-- ============================================================

-- 1. Remove EVERY write policy on civic_nodes and civic_reports,
--    whatever its name (covers policies added in the dashboard too).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('civic_nodes', 'civic_reports')
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2. Remove the table-level write privileges as a second lock.
--    Reads stay (the existing SELECT policies still decide who sees what).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.civic_nodes   FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.civic_reports FROM anon, authenticated;

-- 3. Functions. Postgres lets everyone (PUBLIC) run a new function by
--    default, and Supabase also grants it to anon. Two of ours were
--    callable by anyone, and the others were callable without logging in:
--    auth.uid() is NULL when logged out, and "NULL <> id" is not true, so
--    the "Not authorized" check never fired for a logged-out caller.
--    Fix: only logged-in users may call the ones the app needs.

-- Internal only. Not meant to be called from the app.
REVOKE EXECUTE ON FUNCTION public.apply_temporal_decay()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_spatial_consensus(UUID, FLOAT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;

-- Used by the app: logged-in users only.
REVOKE EXECUTE ON FUNCTION public.submit_civic_report(UUID, FLOAT, FLOAT, TEXT, TEXT, FLOAT, FLOAT)
  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.submit_civic_report(UUID, FLOAT, FLOAT, TEXT, TEXT, FLOAT, FLOAT)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reconfirm_civic_node(UUID, UUID)
  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reconfirm_civic_node(UUID, UUID)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_nearby_nodes(FLOAT, FLOAT, FLOAT, TEXT)
  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_nearby_nodes(FLOAT, FLOAT, FLOAT, TEXT)
  TO authenticated;

-- ============================================================
-- CHECKS. Run these one at a time after the migration.
-- ============================================================

-- A. Should return NO rows with INSERT/UPDATE/DELETE/ALL:
--    SELECT tablename, policyname, cmd FROM pg_policies
--    WHERE schemaname = 'public' AND tablename IN ('civic_nodes','civic_reports');

-- B. Look for nodes someone may already have forged. Verified nodes with
--    fewer than 3 distinct reporters were not verified by the real rule:
--    SELECT n.id, n.category, n.status, n.report_count, n.created_by,
--           (SELECT COUNT(DISTINCT r.user_id) FROM public.civic_reports r
--            WHERE r.node_id = n.id) AS reporters
--    FROM public.civic_nodes n
--    WHERE n.status IN ('verified', 'aging')
--      AND (SELECT COUNT(DISTINCT r.user_id) FROM public.civic_reports r
--           WHERE r.node_id = n.id) < 3;
--    If it returns only your own test data, you are fine. Otherwise tell me
--    what it shows before deleting anything.

-- C. Decay (QA item C8) is still not scheduled. That is the next fix,
--    and is why apply_temporal_decay was only locked here, not scheduled.

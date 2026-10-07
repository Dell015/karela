-- ============================================================
-- KARELA SUPABASE - 08: Account deletion (RA 10173)
-- Run in the Supabase SQL Editor AFTER 07_close_stats_hole.sql.
--
-- aboutkarela.md, "User Privacy Controls": full account deletion within
-- 72 hours of request. This does it right away, from Settings > Delete
-- account, so no one has to process requests by hand.
--
-- What the app does, in order (services/account.ts):
--   1. delete_my_account(p_dry_run => true)   checks this file was run
--   2. removes the user's photos from the civic-photos bucket
--      (storage files can only be removed through the Storage API)
--   3. delete_my_account(p_dry_run => false)  deletes the login; every
--      table with ON DELETE CASCADE goes with it: profiles, run_history,
--      run_summaries, missions, civic_reports
--
-- civic_nodes.created_by has no ON DELETE rule, so deleting a user who
-- started a node would fail. Nodes are shared, neighbour-confirmed city
-- data, so the node stays and only the link to the person is removed.
--
-- Safe to run more than once.
-- ============================================================

-- ---------- 1. Users may delete their own report photos ----------
-- Photos are stored as "<user id>/<timestamp>.jpg" (CivicEngine.uploadCivicPhoto).

DROP POLICY IF EXISTS "Users can delete own civic photos" ON storage.objects;
CREATE POLICY "Users can delete own civic photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'civic-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- 2. Delete my account ----------

CREATE OR REPLACE FUNCTION public.delete_my_account(p_dry_run boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  IF p_dry_run THEN
    RETURN;
  END IF;

  UPDATE public.civic_nodes SET created_by = NULL WHERE created_by = v_uid;

  DELETE FROM auth.users WHERE id = v_uid;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.delete_my_account(boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_my_account(boolean) TO authenticated;

-- ============================================================
-- CHECKS. Run these one at a time after the migration.
-- ============================================================

-- 1. anon cannot run it (expect false):
--    SELECT has_function_privilege('anon', 'public.delete_my_account(boolean)', 'EXECUTE');

-- 2. Every table that points at auth.users and what happens on delete
--    (expect CASCADE everywhere except civic_nodes, which is handled above):
--    SELECT conrelid::regclass AS tbl, confdeltype
--    FROM pg_constraint
--    WHERE confrelid = 'auth.users'::regclass AND contype = 'f';
--    (confdeltype: c = cascade, a = no action)

-- 3. In the app: sign up a throwaway account, make one report with a photo,
--    then Settings > Delete account. You should land on the login screen,
--    and the account should be gone from Authentication > Users.

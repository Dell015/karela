-- ============================================================
-- KARELA DEMO DATA: remove the mock guilds, squads and accounts
--
-- Removes everything added by tuguegarao_demo_guilds.sql: the 3 demo
-- guilds (with their km, badges and boosts), the 6 demo squads and the
-- 18 demo accounts (with their profiles). Real accounts, squads and the
-- landmarks themselves are not touched.
--
-- If a real squad joined or applied to a demo guild, it stays, just
-- without a guild.
-- ============================================================

DELETE FROM public.guilds WHERE id::text LIKE 'de330000-%';
DELETE FROM public.squads WHERE id::text LIKE 'de320000-%';
DELETE FROM auth.users    WHERE id::text LIKE 'de310000-%';

-- Check: all three should be 0.
SELECT
  (SELECT count(*) FROM public.guilds   WHERE id::text LIKE 'de330000-%') AS demo_guilds,
  (SELECT count(*) FROM public.squads   WHERE id::text LIKE 'de320000-%') AS demo_squads,
  (SELECT count(*) FROM public.profiles WHERE id::text LIKE 'de310000-%') AS demo_profiles;

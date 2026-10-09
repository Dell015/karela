-- ============================================================
-- KARELA DEMO DATA: mock civic reports around Tuguegarao City
--
-- FOR SCREENSHOTS AND DEMOS ONLY. These are not real reports.
-- Not a migration: don't add it to the numbered run order.
--
-- What it adds: 13 civic nodes (the map pins) in a circle up to about
-- 370 m around a centre point. 7 verified, 3 aging, 3 pending, across all
-- five categories. Confidence and dates match what the hourly decay job
-- (06_schedule_decay.sql) computes, so it won't immediately change them.
--
-- Every demo row has zone_name = 'karela-demo' and an id starting with
-- de300000-, so they are easy to find and remove
-- (remove_demo_reports.sql). The map doesn't show zone_name.
--
-- HOW TO USE
-- 1. The map only loads pins within 500 m of the phone. Set the centre
--    below to where you will take the screenshot: in Google Maps,
--    long-press the spot and copy the two numbers (latitude, longitude).
--    It is set to the owner's screenshot spot in Tuguegarao City
--    (17.610819, 121.716400, chosen 2026-10-09).
--    (On an emulator you can instead set the emulator's location to the
--    centre.)
-- 2. Run this whole file in the Supabase SQL Editor. Running it again
--    replaces the demo pins and makes them fresh again.
-- 3. Pending pins expire 72 hours after they were reported (that's the
--    real rule), so these last about 2 days. Re-run the file before a
--    demo.
--
-- Needs: schema.sql and 03_civic_engine.sql (PostGIS, civic_nodes).
-- ============================================================

-- Start clean: unlink any real reports that joined a demo pin, then
-- remove the old demo pins.
UPDATE public.civic_reports SET node_id = NULL
WHERE node_id IN (SELECT id FROM public.civic_nodes WHERE zone_name = 'karela-demo');
DELETE FROM public.civic_nodes WHERE zone_name = 'karela-demo';

WITH center AS (
  -- >>> EDIT THESE TWO NUMBERS <<<
  SELECT 17.610819::float AS lat, 121.716400::float AS lng
),
-- dx = metres east, dy = metres north of the centre.
-- Ages are in days before now. verified_d / confirmed_d are null for pending.
demo (n, dx, dy, category, status, reports, first_d, verified_d, confirmed_d) AS (
  VALUES
    -- verified
    ( 1,  120,   80, 'drain_blockage',         'verified', 5,  3.0,  2.5,  1.0),
    ( 2, -150,   60, 'trash',                  'verified', 4,  2.0,  1.8,  0.5),
    ( 3,   60, -200, 'damaged_infrastructure', 'verified', 9, 20.0, 19.0,  4.0),
    ( 4,  -90, -140, 'flooding',               'verified', 6,  1.5,  1.2,  0.2),
    ( 5,  230,  -60, 'unsafe_area',            'verified', 3,  5.0,  4.5,  3.0),
    ( 6, -260,  170, 'damaged_infrastructure', 'verified', 4, 12.0, 11.0,  8.0),
    ( 7,  300,  210, 'drain_blockage',         'verified', 3,  6.0,  5.5,  5.0),
    -- aging (confidence under 50%: "still there?")
    ( 8,  -40,  280, 'trash',                  'aging',    3,  8.0,  7.5,  6.0),
    ( 9, -320,  -90, 'damaged_infrastructure', 'aging',    5, 40.0, 38.0, 28.0),
    (10,  170, -330, 'flooding',               'aging',    3, 12.0, 11.0, 10.0),
    -- pending (waiting for 3 neighbours)
    (11,   20,  140, 'trash',                  'pending',  1,  0.3, NULL, NULL),
    (12, -200, -260, 'drain_blockage',         'pending',  2,  0.8, NULL, NULL),
    (13,  350,  -20, 'unsafe_area',            'pending',  1,  1.0, NULL, NULL)
),
rated AS (
  SELECT d.*,
    -- Same decay rates as services/engines/CivicEngine.ts (DECAY_RATES)
    CASE d.category
      WHEN 'trash' THEN 0.15
      WHEN 'flooding' THEN 0.08
      WHEN 'drain_blockage' THEN 0.08
      WHEN 'damaged_infrastructure' THEN 0.03
      WHEN 'unsafe_area' THEN 0.05
    END AS rate
  FROM demo d
)
INSERT INTO public.civic_nodes (
  id, location, category, status, confidence, decay_rate, report_count,
  first_reported, verified_at, last_confirmed, created_by, zone_name
)
SELECT
  ('de300000-0000-4000-8000-' || lpad(r.n::text, 12, '0'))::uuid,
  ST_SetSRID(ST_MakePoint(
    c.lng + r.dx / (111320.0 * cos(radians(c.lat))),
    c.lat + r.dy / 110574.0
  ), 4326)::geography,
  r.category,
  r.status,
  CASE WHEN r.status = 'pending' THEN 1.0 ELSE exp(-r.rate * r.confirmed_d) END,
  r.rate,
  r.reports,
  now() - r.first_d * interval '1 day',
  CASE WHEN r.verified_d IS NULL THEN NULL ELSE now() - r.verified_d * interval '1 day' END,
  CASE WHEN r.confirmed_d IS NULL THEN NULL ELSE now() - r.confirmed_d * interval '1 day' END,
  NULL,           -- no reporter account: demo pins belong to nobody
  'karela-demo'
FROM rated r CROSS JOIN center c;

-- Check: should list 13 rows (7 verified, 3 aging, 3 pending).
SELECT status, category, report_count, round(confidence::numeric, 2) AS confidence,
       round(ST_Y(location::geometry)::numeric, 5) AS lat,
       round(ST_X(location::geometry)::numeric, 5) AS lng
FROM public.civic_nodes
WHERE zone_name = 'karela-demo'
ORDER BY status, category;

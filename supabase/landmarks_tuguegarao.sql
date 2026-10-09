-- ============================================================
-- KARELA SUPABASE - Territory landmarks for Tuguegarao City
-- Run in the Supabase SQL Editor AFTER 13_territory.sql.
--
-- These are real landmarks (not demo data). Names and centre points were
-- given by the owner on 2026-10-09. Each one gets the default 250 m
-- circle. Ugac Sur and Ugac Norte are 504 m apart, so their circles
-- don't overlap.
--
-- Safe to run more than once: a landmark that already exists (same
-- name) is not added again.
-- To add more later, copy a line in the VALUES list.
-- ============================================================

INSERT INTO public.landmarks (name, latitude, longitude)
SELECT v.name, v.latitude, v.longitude
FROM (VALUES
  ('Ugac Sur',   17.611127, 121.715574),
  ('Ugac Norte', 17.615308, 121.713748),
  ('Buntun',     17.613698, 121.700918)
) AS v (name, latitude, longitude)
WHERE NOT EXISTS (
  SELECT 1 FROM public.landmarks l WHERE l.name = v.name
);

-- Check: should list the three landmarks, each with radius 250 and active.
SELECT name, latitude, longitude, radius_m, active
FROM public.landmarks
ORDER BY name;

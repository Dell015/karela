-- ============================================================
-- KARELA SUPABASE - Civic Engine fixes + Photo Storage
-- Run AFTER 03_civic_engine.sql
-- ============================================================

-- ============================================================
-- 1. FIX get_nearby_nodes — return explicit latitude/longitude
-- The previous version returned the raw GEOGRAPHY column, which the
-- client could not parse. This version emits ST_Y/ST_X as plain floats.
-- ============================================================
DROP FUNCTION IF EXISTS public.get_nearby_nodes(FLOAT, FLOAT, FLOAT, TEXT);

CREATE OR REPLACE FUNCTION public.get_nearby_nodes(
  p_latitude FLOAT,
  p_longitude FLOAT,
  p_radius_meters FLOAT DEFAULT 500.0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  latitude        FLOAT,
  longitude       FLOAT,
  category        TEXT,
  status          TEXT,
  confidence      FLOAT,
  decay_rate      FLOAT,
  report_count    INTEGER,
  first_reported  TIMESTAMPTZ,
  verified_at     TIMESTAMPTZ,
  last_confirmed  TIMESTAMPTZ,
  created_by      UUID,
  zone_name       TEXT,
  distance_meters FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_point GEOGRAPHY;
BEGIN
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;

  RETURN QUERY
  SELECT
    n.id,
    ST_Y(n.location::geometry) AS latitude,
    ST_X(n.location::geometry) AS longitude,
    n.category,
    n.status,
    n.confidence,
    n.decay_rate,
    n.report_count,
    n.first_reported,
    n.verified_at,
    n.last_confirmed,
    n.created_by,
    n.zone_name,
    ST_Distance(n.location, v_point) AS distance_meters
  FROM public.civic_nodes n
  WHERE ST_DWithin(n.location, v_point, p_radius_meters)
    AND (p_status IS NULL OR n.status = p_status)
    AND n.status != 'expired'
  ORDER BY ST_Distance(n.location, v_point);
END;
$$;

-- ============================================================
-- 2. PHOTO STORAGE BUCKET
-- Stores Proof-of-Impact photos for civic reports.
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('civic-photos', 'civic-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own photos
DROP POLICY IF EXISTS "Users can upload civic photos" ON storage.objects;
CREATE POLICY "Users can upload civic photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'civic-photos'
    AND auth.role() = 'authenticated'
  );

-- Photos are publicly readable (so the map/LGU dashboard can display them)
DROP POLICY IF EXISTS "Civic photos are publicly readable" ON storage.objects;
CREATE POLICY "Civic photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'civic-photos');

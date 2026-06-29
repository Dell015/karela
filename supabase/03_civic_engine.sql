-- ============================================================
-- KARELA SUPABASE - Engine 2: Civic Intelligence
-- Run this in the Supabase SQL Editor AFTER schema.sql + 02_realtime_and_history.sql
-- ============================================================

-- 1. Enable PostGIS (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 2. CIVIC NODES TABLE
-- Core spatial table for crowdsourced urban reports.
-- Implements the node lifecycle: Pending → Verified → Aging → Expired
-- ============================================================
CREATE TABLE IF NOT EXISTS public.civic_nodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  category        TEXT NOT NULL,  -- trash, flooding, drain_blockage, damaged_infrastructure, unsafe_area
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending, verified, aging, expired
  confidence      FLOAT DEFAULT 1.0,
  decay_rate      FLOAT DEFAULT 0.1,  -- μ (category-specific)
  report_count    INTEGER DEFAULT 1,
  first_reported  TIMESTAMPTZ DEFAULT now(),
  verified_at     TIMESTAMPTZ,
  last_confirmed  TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  zone_name       TEXT  -- barangay or area label
);

-- Spatial index for ST_DWithin proximity queries
CREATE INDEX IF NOT EXISTS civic_nodes_location_idx
  ON public.civic_nodes USING GIST (location);

CREATE INDEX IF NOT EXISTS civic_nodes_status_idx
  ON public.civic_nodes (status);

ALTER TABLE public.civic_nodes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read civic nodes (public good)
DROP POLICY IF EXISTS "Authenticated users can read civic nodes" ON public.civic_nodes;
CREATE POLICY "Authenticated users can read civic nodes"
  ON public.civic_nodes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can insert new reports
DROP POLICY IF EXISTS "Authenticated users can report" ON public.civic_nodes;
CREATE POLICY "Authenticated users can report"
  ON public.civic_nodes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only the system (via RPC functions) updates nodes
DROP POLICY IF EXISTS "System can update nodes" ON public.civic_nodes;
CREATE POLICY "System can update nodes"
  ON public.civic_nodes FOR UPDATE
  USING (true);

-- ============================================================
-- 3. CIVIC REPORTS TABLE (individual user submissions)
-- Each report links to a civic_node. Multiple reports can cluster
-- into the same node via spatial consensus.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.civic_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id         UUID REFERENCES public.civic_nodes(id),
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  category        TEXT NOT NULL,
  photo_url       TEXT,
  device_heading  FLOAT,  -- device orientation at capture time
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS civic_reports_user_idx
  ON public.civic_reports (user_id);
CREATE INDEX IF NOT EXISTS civic_reports_node_idx
  ON public.civic_reports (node_id);
CREATE INDEX IF NOT EXISTS civic_reports_location_idx
  ON public.civic_reports USING GIST (location);

ALTER TABLE public.civic_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own reports" ON public.civic_reports;
CREATE POLICY "Users can insert own reports"
  ON public.civic_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read all reports" ON public.civic_reports;
CREATE POLICY "Users can read all reports"
  ON public.civic_reports FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. SPATIAL CONSENSUS FUNCTION (DBSCAN-Inspired)
-- Checks if a newly submitted report has enough nearby corroborating
-- reports to promote its node to "verified" status.
--
-- Parameters:
--   epsilon_meters: spatial radius for cluster membership (default 25m)
--   min_reports: minimum independent reports needed (default 3)
--   time_window_hours: temporal window for corroboration (default 72h)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_spatial_consensus(
  p_node_id UUID,
  p_epsilon_meters FLOAT DEFAULT 25.0,
  p_min_reports INTEGER DEFAULT 3,
  p_time_window_hours INTEGER DEFAULT 72
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_node_location GEOGRAPHY;
  v_node_category TEXT;
  v_node_created TIMESTAMPTZ;
  v_report_count INTEGER;
  v_unique_reporters INTEGER;
BEGIN
  -- Get the node's details
  SELECT location, category, first_reported
  INTO v_node_location, v_node_category, v_node_created
  FROM public.civic_nodes
  WHERE id = p_node_id;

  IF v_node_location IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Count independent reports within epsilon radius AND time window AND same category
  -- CRITICAL: Reports must be from DIFFERENT users (prevents self-verification)
  SELECT COUNT(DISTINCT user_id)
  INTO v_unique_reporters
  FROM public.civic_reports
  WHERE category = v_node_category
    AND ST_DWithin(location, v_node_location, p_epsilon_meters)
    AND created_at >= v_node_created - (p_time_window_hours || ' hours')::INTERVAL
    AND created_at <= v_node_created + (p_time_window_hours || ' hours')::INTERVAL;

  -- Update the node's report count
  UPDATE public.civic_nodes
  SET report_count = v_unique_reporters
  WHERE id = p_node_id;

  -- If we have enough unique reporters, promote to verified
  IF v_unique_reporters >= p_min_reports THEN
    UPDATE public.civic_nodes
    SET status = 'verified',
        verified_at = now(),
        last_confirmed = now(),
        confidence = 1.0
    WHERE id = p_node_id AND status = 'pending';
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ============================================================
-- 5. SUBMIT CIVIC REPORT (Main RPC)
-- Called by the app when a user reports an issue.
-- Handles: node creation/clustering + consensus check
-- ============================================================
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
  v_point GEOGRAPHY;
  v_existing_node_id UUID;
  v_new_node_id UUID;
  v_report_id UUID;
  v_consensus BOOLEAN;
  v_decay FLOAT;
BEGIN
  -- Validate caller
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Spatial dedup: check if the same user already reported this location today
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;

  IF EXISTS (
    SELECT 1 FROM public.civic_reports
    WHERE user_id = p_user_id
      AND category = p_category
      AND ST_DWithin(location, v_point, p_epsilon_meters)
      AND created_at::DATE = CURRENT_DATE
  ) THEN
    RETURN json_build_object('error', 'duplicate_report', 'message', 'You already reported this area today.');
  END IF;

  -- Look for an existing pending/verified node nearby (same category)
  SELECT id INTO v_existing_node_id
  FROM public.civic_nodes
  WHERE category = p_category
    AND status IN ('pending', 'verified')
    AND ST_DWithin(location, v_point, p_epsilon_meters)
  ORDER BY ST_Distance(location, v_point)
  LIMIT 1;

  -- Set category-specific decay rate
  v_decay := CASE p_category
    WHEN 'trash' THEN 0.15           -- decays fast (cleared in days)
    WHEN 'flooding' THEN 0.08        -- medium (seasonal)
    WHEN 'drain_blockage' THEN 0.08  -- medium
    WHEN 'damaged_infrastructure' THEN 0.03  -- slow (persists weeks/months)
    WHEN 'unsafe_area' THEN 0.05     -- medium-slow
    ELSE 0.1
  END;

  IF v_existing_node_id IS NOT NULL THEN
    -- Cluster with existing node
    v_new_node_id := v_existing_node_id;

    -- If it's verified and this is a reconfirmation, reset confidence
    UPDATE public.civic_nodes
    SET last_confirmed = now(),
        confidence = 1.0
    WHERE id = v_existing_node_id AND status = 'verified';
  ELSE
    -- Create a new pending node
    INSERT INTO public.civic_nodes (location, category, status, decay_rate, created_by)
    VALUES (v_point, p_category, 'pending', v_decay, p_user_id)
    RETURNING id INTO v_new_node_id;
  END IF;

  -- Save the individual report
  INSERT INTO public.civic_reports (user_id, node_id, location, category, photo_url, device_heading)
  VALUES (p_user_id, v_new_node_id, v_point, p_category, p_photo_url, p_device_heading)
  RETURNING id INTO v_report_id;

  -- Check spatial consensus (may promote node to verified)
  v_consensus := check_spatial_consensus(v_new_node_id, p_epsilon_meters);

  RETURN json_build_object(
    'success', true,
    'report_id', v_report_id,
    'node_id', v_new_node_id,
    'consensus_reached', v_consensus,
    'node_status', (SELECT status FROM public.civic_nodes WHERE id = v_new_node_id)
  );
END;
$$;

-- ============================================================
-- 6. TEMPORAL DECAY FUNCTION
-- Called periodically (e.g., daily cron or on-demand) to age nodes.
-- C(t) = C_0 × e^(−μ × (t − t_verified))
-- Nodes with confidence below threshold transition to 'aging' then 'expired'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_temporal_decay()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  -- Update confidence for all verified/aging nodes based on time since last confirmation
  UPDATE public.civic_nodes
  SET confidence = GREATEST(0,
    1.0 * EXP(-decay_rate * EXTRACT(EPOCH FROM (now() - COALESCE(last_confirmed, verified_at, first_reported))) / 86400)
  )
  WHERE status IN ('verified', 'aging');

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Transition verified nodes with low confidence to aging
  UPDATE public.civic_nodes
  SET status = 'aging'
  WHERE status = 'verified' AND confidence < 0.5;

  -- Expire aging nodes with very low confidence
  UPDATE public.civic_nodes
  SET status = 'expired'
  WHERE status = 'aging' AND confidence < 0.1;

  -- Expire pending nodes that never got verified (older than time window)
  UPDATE public.civic_nodes
  SET status = 'expired'
  WHERE status = 'pending'
    AND first_reported < now() - INTERVAL '72 hours';

  RETURN v_updated;
END;
$$;

-- ============================================================
-- 7. RECONFIRM NODE RPC
-- Called when a runner passes a verified node and taps "Still There"
-- Resets the confidence decay timer.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reconfirm_civic_node(
  p_node_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.civic_nodes
  SET last_confirmed = now(),
      confidence = 1.0,
      status = 'verified'  -- resurrects aging nodes too
  WHERE id = p_node_id
    AND status IN ('verified', 'aging');

  RETURN FOUND;
END;
$$;

-- ============================================================
-- 8. GET NEARBY CIVIC NODES (for map display)
-- Returns nodes within a radius of a given point.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_nearby_nodes(
  p_latitude FLOAT,
  p_longitude FLOAT,
  p_radius_meters FLOAT DEFAULT 500.0,
  p_status TEXT DEFAULT NULL
)
RETURNS SETOF public.civic_nodes
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_point GEOGRAPHY;
BEGIN
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;

  RETURN QUERY
  SELECT *
  FROM public.civic_nodes
  WHERE ST_DWithin(location, v_point, p_radius_meters)
    AND (p_status IS NULL OR status = p_status)
    AND status != 'expired'
  ORDER BY ST_Distance(location, v_point);
END;
$$;

-- Enable realtime for civic_nodes
ALTER PUBLICATION supabase_realtime ADD TABLE public.civic_nodes;

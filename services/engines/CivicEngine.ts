/**
 * ============================================================
 * CIVIC ENGINE — Karela Distributed Urban Sensing
 * ============================================================
 *
 * Thesis Component: DBSCAN-Inspired Spatial Consensus + Temporal Decay
 * Research Question (RQ2): "Does a geospatial crowdsourcing system that scales
 *   Civic Quest complexity from individual reports to collaborative multi-user
 *   verification tasks produce higher civic participation rates and lower
 *   false-report rates compared to a flat single-submission reporting system?"
 *
 * Architecture:
 * - Users submit reports (photo + GPS + category) during runs
 * - Reports cluster spatially via ST_DWithin() (PostGIS)
 * - 3+ independent reporters within ε radius + time window → node verified
 * - Verified nodes decay over time: C(t) = C_0 × e^(−μ × (t − t_verified))
 * - Reconfirmation resets the decay timer
 *
 * Node Lifecycle:
 *   Pending → Verified → Aging → Expired
 *                ↑                    |
 *                └─── Reconfirmed ────┘
 */

import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "../database/supabase/config";

// ============================================================
// TYPES
// ============================================================

export type CivicCategory =
  | "trash"
  | "flooding"
  | "drain_blockage"
  | "damaged_infrastructure"
  | "unsafe_area";

export type NodeStatus = "pending" | "verified" | "aging" | "expired";

export interface CivicNode {
  id: string;
  location: any; // PostGIS GEOGRAPHY
  latitude: number;
  longitude: number;
  category: CivicCategory;
  status: NodeStatus;
  confidence: number;
  decay_rate: number;
  report_count: number;
  first_reported: string;
  verified_at: string | null;
  last_confirmed: string | null;
  created_by: string;
  zone_name: string | null;
}

export interface CivicReport {
  id: string;
  user_id: string;
  node_id: string;
  category: CivicCategory;
  photo_url: string | null;
  created_at: string;
}

export interface SubmitReportResult {
  success: boolean;
  report_id?: string;
  node_id?: string;
  consensus_reached?: boolean;
  node_status?: NodeStatus;
  error?: string;
  message?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

export const CIVIC_CATEGORIES: { id: CivicCategory; label: string; icon: string }[] = [
  { id: "trash", label: "Trash/Litter", icon: "trash-outline" },
  { id: "flooding", label: "Flooding", icon: "water-outline" },
  { id: "drain_blockage", label: "Drain Blockage", icon: "warning-outline" },
  { id: "damaged_infrastructure", label: "Damaged Infrastructure", icon: "construct-outline" },
  { id: "unsafe_area", label: "Unsafe Area", icon: "alert-circle-outline" },
];

// Category-specific decay rates (μ) — matches the SQL function
export const DECAY_RATES: Record<CivicCategory, number> = {
  trash: 0.15,                    // Cleared within days
  flooding: 0.08,                 // Seasonal, variable
  drain_blockage: 0.08,           // Medium
  damaged_infrastructure: 0.03,   // Persists weeks/months
  unsafe_area: 0.05,              // Medium-slow
};

// Spatial consensus parameters
export const CONSENSUS_CONFIG = {
  EPSILON_METERS: 25,       // Radius for cluster membership
  MIN_REPORTS: 3,           // Minimum independent reporters needed
  TIME_WINDOW_HOURS: 72,    // Reports must arrive within this window
};

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Submits a civic report.
 * Handles node creation/clustering + consensus check server-side.
 * Returns whether consensus was reached (node promoted to verified).
 */
export const submitCivicReport = async (
  userId: string,
  latitude: number,
  longitude: number,
  category: CivicCategory,
  photoUrl?: string,
  deviceHeading?: number
): Promise<SubmitReportResult> => {
  const { data, error } = await supabase.rpc("submit_civic_report", {
    p_user_id: userId,
    p_latitude: latitude,
    p_longitude: longitude,
    p_category: category,
    p_photo_url: photoUrl ?? null,
    p_device_heading: deviceHeading ?? null,
    p_epsilon_meters: CONSENSUS_CONFIG.EPSILON_METERS,
  });

  if (error) {
    console.error("Civic report submission failed:", error);
    return { success: false, error: error.message };
  }

  return data as SubmitReportResult;
};

/**
 * Fetches civic nodes near a given location (for map overlay).
 * The get_nearby_nodes RPC now returns explicit latitude/longitude columns.
 */
export const getNearbyNodes = async (
  latitude: number,
  longitude: number,
  radiusMeters: number = 500,
  statusFilter?: NodeStatus
): Promise<CivicNode[]> => {
  const { data, error } = await supabase.rpc("get_nearby_nodes", {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_meters: radiusMeters,
    p_status: statusFilter ?? null,
  });

  if (error) {
    console.error("Failed to fetch nearby nodes:", error);
    return [];
  }

  // RPC returns latitude/longitude as plain floats (via ST_Y/ST_X)
  return (data || []).map((node: any) => ({
    ...node,
    latitude: Number(node.latitude),
    longitude: Number(node.longitude),
  }));
};

/**
 * Uploads a civic report photo to Supabase Storage.
 * Returns the public URL, or null on failure.
 */
export const uploadCivicPhoto = async (
  userId: string,
  fileUri: string
): Promise<string | null> => {
  try {
    // Read the local file as base64, then convert to ArrayBuffer for upload
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const arrayBuffer = decode(base64);

    const filePath = `${userId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("civic-photos")
      .upload(filePath, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Photo upload failed:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("civic-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (e) {
    console.error("Photo upload error:", e);
    return null;
  }
};

/**
 * Reconfirms a verified/aging node ("Still There" tap during a run).
 * Resets the confidence decay timer.
 */
export const reconfirmNode = async (
  nodeId: string,
  userId: string
): Promise<boolean> => {
  const { data, error } = await supabase.rpc("reconfirm_civic_node", {
    p_node_id: nodeId,
    p_user_id: userId,
  });

  if (error) {
    console.error("Reconfirmation failed:", error);
    return false;
  }

  return data === true;
};

/**
 * Triggers temporal decay processing (call periodically or on app open).
 * In production this would be a Supabase Edge Function cron job.
 */
export const applyDecay = async (): Promise<number> => {
  const { data, error } = await supabase.rpc("apply_temporal_decay");

  if (error) {
    console.error("Temporal decay failed:", error);
    return 0;
  }

  return data as number;
};

/**
 * Gets all nodes for a user's civic contribution history.
 */
export const getUserReports = async (userId: string): Promise<CivicReport[]> => {
  const { data, error } = await supabase
    .from("civic_reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch user reports:", error);
    return [];
  }

  return data || [];
};

/**
 * Calculates the Civic Contribution Score for a user.
 *
 * C = (XP_mission × S) + (V × CivicXP_base × B)
 *
 * Where:
 *   XP_mission = distance-based XP from the run
 *   S = streak multiplier
 *   V = verification status (0, 0.5, 1.0)
 *   CivicXP_base = base per category
 *   B = Bayanihan buff (1.0 baseline, 1.5 during emergency)
 */
export const calculateCivicScore = (
  distanceXP: number,
  streakMultiplier: number,
  verificationStatus: 0 | 0.5 | 1,
  category: CivicCategory,
  isBayanihanActive: boolean = false
): number => {
  const CIVIC_XP_BASE: Record<CivicCategory, number> = {
    trash: 100,
    flooding: 150,
    drain_blockage: 150,
    damaged_infrastructure: 200,
    unsafe_area: 175,
  };

  const bayanihanBuff = isBayanihanActive ? 1.5 : 1.0;
  const civicBase = CIVIC_XP_BASE[category] || 100;

  return Math.floor(
    (distanceXP * streakMultiplier) + (verificationStatus * civicBase * bayanihanBuff)
  );
};

// ============================================================
// UTILITIES
// ============================================================
// (coordinate parsing now handled server-side via ST_Y/ST_X in get_nearby_nodes)

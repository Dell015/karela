/**
 * The numbers for one run, in one place, so the run screen, the summary and
 * the saved run always agree. See docs/COMPUTATIONS.md.
 *
 * Every function returns a safe value (0 or null), never NaN or Infinity:
 * a run with no distance or no time shows "--", not "NaN".
 */
import { calculateDistance } from "@/services/tracker/geoUtils";

export type TrackPoint = { latitude: number; longitude: number; isVehicle?: boolean; timestamp?: number };

/** Faster than this is a vehicle, not running (the server uses the same cap). */
export const VEHICLE_KMH = 35;
/** A GPS jump bigger than this between two fixes is a glitch, not running. */
export const MAX_SEGMENT_M = 100;
/** Runs shorter than this aren't worth saving. */
export const MIN_SAVE_M = 50;
/** Pace needs at least this much distance to mean anything. */
const MIN_PACE_M = 100;

/**
 * Metres run along the path. Leaves out segments flagged as vehicle travel,
 * impossible jumps, and any segment whose index is in `skip` (paused time).
 */
export const pathDistance = (path: TrackPoint[], skip?: (segmentIndex: number) => boolean) => {
  let m = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (!a || !b || b.isVehicle || skip?.(i)) continue;
    const d = calculateDistance(a, b);
    if (Number.isFinite(d) && d > 0 && d <= MAX_SEGMENT_M) m += d;
  }
  return m;
};

/** XP: 1 per 10 m (aboutkarela.md, COMPUTATIONS.md). */
export const xpFor = (meters: number) => (Number.isFinite(meters) && meters > 0 ? Math.floor(meters / 10) : 0);

/**
 * Calories, an estimate: about 1 kcal per kg of body weight per km, the
 * usual rule of thumb for running and brisk walking. Uses the weight from
 * the profile; 70 kg if it's missing.
 */
export const caloriesFor = (meters: number, weightKg?: number | null) => {
  const w = Number(weightKg);
  const kg = Number.isFinite(w) && w >= 20 && w <= 300 ? w : 70;
  const km = Number.isFinite(meters) && meters > 0 ? meters / 1000 : 0;
  return Math.round(km * kg);
};

/** Seconds per km, or null when there isn't enough to say. */
export const paceFor = (meters: number, seconds: number): number | null => {
  if (!Number.isFinite(meters) || !Number.isFinite(seconds) || meters < MIN_PACE_M || seconds <= 0) return null;
  const p = seconds / (meters / 1000);
  return p >= 150 && p <= 1800 ? p : null; // 2:30 to 30:00 per km
};

/** km/h, or null. */
export const speedFor = (meters: number, seconds: number): number | null => {
  if (!Number.isFinite(meters) || !Number.isFinite(seconds) || meters <= 0 || seconds <= 0) return null;
  return (meters / seconds) * 3.6;
};

/** "6:12" or "--". */
export const paceText = (p: number | null) => {
  if (p === null || !Number.isFinite(p)) return "--";
  const total = Math.round(p); // round first, so 6:59.6 becomes 7:00, not 6:60
  return `${Math.floor(total / 60)}:${`${total % 60}`.padStart(2, "0")}`;
};

/** "12:05" or "1:02:05". */
export const clockText = (seconds: number) => {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${`${m}`.padStart(2, "0")}:${`${sec}`.padStart(2, "0")}`
    : `${m}:${`${sec}`.padStart(2, "0")}`;
};

/** "0.85" km for short runs, "12.3" for long ones. */
export const kmText = (meters: number) => {
  const km = Number.isFinite(meters) && meters > 0 ? meters / 1000 : 0;
  return km < 10 ? km.toFixed(2) : km.toFixed(1);
};

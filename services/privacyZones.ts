import {
  getLocalSettings,
  PRIVACY_ZONE_RADIUS_M,
  PrivacyZone,
} from "@/services/localSettings";
import { calculateDistance } from "@/services/tracker/geoUtils";

/**
 * Privacy Zones (aboutkarela.md "User Privacy Controls"): GPS points inside a
 * zone are never stored, not even in SQLite. Every run path goes through
 * stripPrivacyZones() before it is written anywhere.
 *
 * The run's distance and time are counted from the full live trail before
 * this runs, so a zone never costs the user distance or XP. The saved ghost
 * path just has a gap where the zone was.
 */

export const isInPrivacyZone = (
  point: { latitude: number; longitude: number },
  zones: PrivacyZone[],
) => zones.some((z) => calculateDistance(point, z) <= PRIVACY_ZONE_RADIUS_M);

export const stripPrivacyZones = async <
  T extends { latitude: number; longitude: number },
>(
  path: T[],
): Promise<T[]> => {
  const { privacyZones } = await getLocalSettings();
  if (privacyZones.length === 0) return path;
  return path.filter(
    (p) =>
      Number.isFinite(p?.latitude) &&
      Number.isFinite(p?.longitude) &&
      !isInPrivacyZone(p, privacyZones),
  );
};

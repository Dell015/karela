// services/tracker/routingService.ts

export interface MapCoordinate {
  id: string;
  latitude: number;
  longitude: number;
}

export interface QuestData {
  coordinates: MapCoordinate[];
  distanceMeters: number;
  rewards: {
    coins: number;
    xp: number;
  };
}

/**
 * Pure logic for game economy.
 */
export const calculateQuestRewards = (distanceInMeters: number) => {
  const baseCoins = Math.floor(distanceInMeters / 100);
  const baseXp = Math.floor(distanceInMeters / 20);
  const bonusMultiplier = distanceInMeters > 2000 ? 1.5 : 1;

  return {
    coins: Math.floor(baseCoins * bonusMultiplier),
    xp: Math.floor(baseXp * bonusMultiplier),
  };
};

/**
 * Helper to calculate direct distance (Haversine)
 */
const calculateDirectDistance = (
  p1: { latitude: number; longitude: number },
  p2: { latitude: number; longitude: number }
) => {
  const R = 6371e3;
  const φ1 = (p1.latitude * Math.PI) / 180;
  const φ2 = (p2.latitude * Math.PI) / 180;
  const Δφ = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const Δλ = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Chaikin corner-cutting algorithm for smooth routes.
 * 
 * Unlike Catmull-Rom splines, Chaikin NEVER overshoots or creates loops.
 * It works by repeatedly cutting corners: each iteration replaces each point
 * with two new points at 25% and 75% along each segment.
 *
 * The result is a visually smooth curve that stays within the convex hull
 * of the original points — no twirling, no artifacts.
 *
 * @param points - original route coordinates
 * @param iterations - how many smoothing passes (2 = good balance of smooth vs. accuracy)
 */
const smoothRoute = (
  points: { latitude: number; longitude: number }[],
  iterations: number = 2
): { latitude: number; longitude: number }[] => {
  if (points.length < 3) return points;

  let current = points;

  for (let iter = 0; iter < iterations; iter++) {
    const next: { latitude: number; longitude: number }[] = [];

    // Always keep the first point
    next.push(current[0]);

    for (let i = 0; i < current.length - 1; i++) {
      const p1 = current[i];
      const p2 = current[i + 1];

      // Q = 75% of p1 + 25% of p2 (closer to start)
      next.push({
        latitude: 0.75 * p1.latitude + 0.25 * p2.latitude,
        longitude: 0.75 * p1.longitude + 0.25 * p2.longitude,
      });

      // R = 25% of p1 + 75% of p2 (closer to end)
      next.push({
        latitude: 0.25 * p1.latitude + 0.75 * p2.latitude,
        longitude: 0.25 * p1.longitude + 0.75 * p2.longitude,
      });
    }

    // Always keep the last point
    next.push(current[current.length - 1]);

    current = next;
  }

  return current;
};

/**
 * Fetches a pedestrian walking route using OSRM (foot profile).
 *
 * Key settings:
 * - Profile: `foot` — uses sidewalks, paths, pedestrian crossings (not highways/one-ways)
 * - continue_straight=false — allows u-turns and tight navigation natural to walkers
 * - overview=full + geometries=geojson — full resolution path
 *
 * The route is then smoothed via Catmull-Rom spline to eliminate sharp angular corners.
 */
export const getMultiPointRoute = async (
  points: any[]
): Promise<QuestData | null> => {
  if (points.length < 2) return null;

  try {
    const coordsString = points
      .map((p) => `${p.longitude},${p.latitude}`)
      .join(";");

    // OSRM foot profile — routes along pedestrian-accessible paths
    // continue_straight=false allows tighter turns natural to walking
    const url = `https://router.project-osrm.org/route/v1/foot/${coordsString}?overview=full&geometries=geojson&continue_straight=false`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const distance = data.routes[0].distance;
      const rawCoords = data.routes[0].geometry.coordinates.map((c: any) => ({
        latitude: c[1],
        longitude: c[0],
      }));

      // Apply Chaikin corner-cutting for smooth curves (no loops/twirls)
      const smoothed = smoothRoute(rawCoords, 2);

      return {
        coordinates: smoothed.map((c) => ({
          ...c,
          id: Math.random().toString(36).substring(7),
        })),
        distanceMeters: distance,
        rewards: calculateQuestRewards(distance),
      };
    }

    // PH FALLBACK: Direct lines if OSRM fails (offline, no coverage)
    let totalDirectDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDirectDist += calculateDirectDistance(points[i], points[i + 1]);
    }

    return {
      coordinates: points.map((p) => ({
        ...p,
        id: p.id || Math.random().toString(36).substring(7),
      })),
      distanceMeters: totalDirectDist,
      rewards: calculateQuestRewards(totalDirectDist),
    };
  } catch (error) {
    console.error("OSRM Routing Error:", error);
    return null;
  }
};

/**
 * Snaps a coordinate to the nearest pedestrian-accessible road/path.
 * Uses OSRM foot profile so it snaps to sidewalks/paths, not car roads.
 */
export const snapToRoad = async (
  latitude: number,
  longitude: number
): Promise<{ latitude: number; longitude: number }> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/nearest/v1/foot/${longitude},${latitude}`
    );
    const data = await response.json();

    if (data.code === "Ok" && data.waypoints.length > 0) {
      const [snapLong, snapLat] = data.waypoints[0].location;
      return { latitude: snapLat, longitude: snapLong };
    }
  } catch (error) {
    // Silent fallback — return original
  }
  return { latitude, longitude };
};

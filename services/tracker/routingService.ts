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
 * Helper to calculate direct distance (Haversine) as a fallback
 */
const calculateDirectDistance = (p1: {latitude: number, longitude: number}, p2: {latitude: number, longitude: number}) => {
  const R = 6371e3; // metres
  const φ1 = (p1.latitude * Math.PI) / 180;
  const φ2 = (p2.latitude * Math.PI) / 180;
  const Δφ = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const Δλ = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Fetches a pedestrian route with a Direct Line fallback.
 */
export const getMultiPointRoute = async (points: any[]): Promise<QuestData | null> => {
  if (points.length < 2) return null;

  try {
    const coordsString = points.map(p => `${p.longitude},${p.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/foot/${coordsString}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const distance = data.routes[0].distance;
      return {
        coordinates: data.routes[0].geometry.coordinates.map((c: any) => ({
          latitude: c[1],
          longitude: c[0],
          id: Math.random().toString(36).substring(7),
        })),
        distanceMeters: distance,
        rewards: calculateQuestRewards(distance),
      };
    }

    // PH FALLBACK: Direct lines if OSRM fails
    let totalDirectDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDirectDist += calculateDirectDistance(points[i], points[i+1]);
    }

    return {
      coordinates: points.map(p => ({ ...p, id: p.id || Math.random().toString(36).substring(7) })),
      distanceMeters: totalDirectDist,
      rewards: calculateQuestRewards(totalDirectDist),
    };
  } catch (error) {
    console.error("OSRM Routing Error:", error);
    return null;
  }
};

export const snapToRoad = async (latitude: number, longitude: number): Promise<{latitude: number, longitude: number}> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/nearest/v1/foot/${longitude},${latitude}`
    );
    const data = await response.json();

    if (data.code === 'Ok' && data.waypoints.length > 0) {
      const [snapLong, snapLat] = data.waypoints[0].location;
      return { latitude: snapLat, longitude: snapLong };
    }
  } catch (error) {}
  return { latitude, longitude };
};
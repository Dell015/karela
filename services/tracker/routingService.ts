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
 * Keeps calculations out of the UI and Hooks.
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
 * Fetches a pedestrian route connecting multiple points in order.
 */
export const getMultiPointRoute = async (points: MapCoordinate[]): Promise<QuestData | null> => {
  if (points.length < 2) return null;

  try {
    const coordsString = points.map(p => `${p.longitude},${p.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/foot/${coordsString}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const distance = data.routes[0].distance;
      return {
        coordinates: data.routes[0].geometry.coordinates.map((c: any) => ({
          latitude: c[1],
          longitude: c[0],
        })),
        distanceMeters: distance,
        rewards: calculateQuestRewards(distance),
      };
    }
    return null;
  } catch (error) {
    console.error("OSRM Routing Error:", error);
    return null;
  }
};
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getBuffs } from "@/services/buffs";
import { callRpc, RpcError } from "@/services/rpc";
import { calculateDistance } from "@/services/tracker/geoUtils";
import { uuid } from "@/services/uuid";
import type { GuildColor } from "@/services/guilds";

/**
 * Landmark territory (supabase/13_territory.sql).
 *
 * Privacy: the route stays on the phone. After a run this file works out how
 * far the runner went inside each landmark zone and uploads only
 * (landmark, km). Entries wait in a queue while offline; each has a UUID so a
 * retry never counts twice.
 */

export interface Landmark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_m: number;
}

export interface Holder {
  guild_id: string | null;
  name?: string;
  color?: GuildColor;
  reason: "last_month" | "challenged" | "claimed" | "unclaimed";
}

export interface LandmarkState extends Landmark {
  holder: Holder;
  month_top: { guild_id: string; name: string; color: GuildColor; km: number }[];
  my_guild_month_km: number;
  my_guild_week_km: number;
}

export interface TerritoryState {
  rules: {
    challenge_ratio: number;
    challenge_days: number;
    forfeit_days: number;
    min_claim_km: number;
    boost_multiplier: number;
  };
  my_guild_id: string | null;
  boost_until: string | null;
  landmarks: LandmarkState[];
}

const LANDMARKS_KEY = "karela.landmarks.v1";
const QUEUE_KEY = "karela.territoryQueue.v1";
const MAX_AGE_MS = 7 * 86_400_000; // the server ignores older entries

/** Territory standings; also refreshes the landmark list kept for offline runs. */
export const getTerritories = async (): Promise<TerritoryState> => {
  const state = await callRpc<TerritoryState>("get_territories");
  const slim: Landmark[] = state.landmarks.map(({ id, name, latitude, longitude, radius_m }) => ({
    id, name, latitude, longitude, radius_m,
  }));
  AsyncStorage.setItem(LANDMARKS_KEY, JSON.stringify(slim)).catch(() => {});
  return state;
};

const cachedLandmarks = async (): Promise<Landmark[]> => {
  try {
    const raw = await AsyncStorage.getItem(LANDMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

type PathPoint = { latitude: number; longitude: number; isVehicle?: boolean };

/** Kilometres travelled inside each zone: segments with both ends inside count. */
export const zoneDistances = (path: PathPoint[], landmarks: Landmark[]) => {
  const km: Record<string, number> = {};
  for (const l of landmarks) {
    let meters = 0;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      if (!a || !b || b.isVehicle) continue; // rides in a vehicle never count
      if (calculateDistance(a, l) <= l.radius_m && calculateDistance(b, l) <= l.radius_m) {
        meters += calculateDistance(a, b);
      }
    }
    if (meters >= 10) km[l.id] = Math.round(meters) / 1000;
  }
  return km;
};

interface QueueEntry {
  id: string;
  landmark_id: string;
  km: number;
  at: string;
}

const readQueue = async (): Promise<QueueEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const writeQueue = (q: QueueEntry[]) => AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));

/** Sends queued entries. Keeps them if offline; drops them if they can never count. */
export const flushTerritoryQueue = async () => {
  const now = Date.now();
  const queue = (await readQueue()).filter((e) => now - new Date(e.at).getTime() < MAX_AGE_MS);
  if (queue.length === 0) {
    await writeQueue([]);
    return;
  }
  try {
    await callRpc<number>("log_territory", { p_entries: queue.slice(0, 50) });
    await writeQueue(queue.slice(50));
  } catch (e) {
    // Not set up on the server: nothing to keep trying for.
    if (e instanceof RpcError && e.notSetUp) await writeQueue([]);
    else await writeQueue(queue);
  }
};

/**
 * Called when a run is finished, before the route is thrown away. Only
 * guild members' distance counts, so nothing is queued for anyone else.
 */
export const recordRunTerritory = async (path: PathPoint[], finishedAt = new Date()) => {
  const buffs = await getBuffs();
  if (!buffs.guild_id) return;
  const landmarks = await cachedLandmarks();
  if (landmarks.length === 0) return;
  const km = zoneDistances(path, landmarks);
  const entries = Object.entries(km).map(([landmark_id, k]) => ({
    id: uuid(),
    landmark_id,
    km: k,
    at: finishedAt.toISOString(),
  }));
  if (entries.length === 0) return;
  await writeQueue([...(await readQueue()), ...entries]);
  await flushTerritoryQueue();
};

export const HOLDER_REASON: Record<Holder["reason"], string> = {
  last_month: "Won last month",
  challenged: "Took it this week",
  claimed: "Claimed this week",
  unclaimed: "Unclaimed",
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { callRpc } from "@/services/rpc";

/**
 * What the Shop and the guild change on this phone: equipped cosmetics, the
 * Bayanihan Boost and guild badge buffs (supabase/13_territory.sql,
 * get_my_buffs). Read once at app start and after a purchase or guild change,
 * then kept on the phone so the map and rewards work offline.
 */

export interface Buffs {
  /** Run-line colours on the map; null = default lime. Several = a gradient. */
  trail: string[] | null;
  /** Profile photo ring colours; null = default Karela gradient. */
  frame: string[] | null;
  civic_xp_multiplier: number;
  civic_boost_until: string | null;
  guild_id: string | null;
  xp_multiplier: number;
  gem_multiplier: number;
  guild_map_theme: boolean;
}

export const NO_BUFFS: Buffs = {
  trail: null,
  frame: null,
  civic_xp_multiplier: 1,
  civic_boost_until: null,
  guild_id: null,
  xp_multiplier: 1,
  gem_multiplier: 1,
  guild_map_theme: false,
};

const KEY = "karela.buffs.v1";
let cache: Buffs | null = null;
const listeners = new Set<(b: Buffs) => void>();

const publish = (b: Buffs) => {
  cache = b;
  listeners.forEach((l) => l(b));
};

export const getBuffs = async (): Promise<Buffs> => {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? { ...NO_BUFFS, ...JSON.parse(raw) } : NO_BUFFS;
  } catch {
    cache = NO_BUFFS;
  }
  return cache!;
};

/** Fetches fresh buffs. Keeps the last known ones if offline or not set up. */
export const refreshBuffs = async (): Promise<Buffs> => {
  try {
    const fresh = { ...NO_BUFFS, ...(await callRpc<Partial<Buffs>>("get_my_buffs")) };
    fresh.civic_xp_multiplier = Number(fresh.civic_xp_multiplier) || 1;
    fresh.xp_multiplier = Number(fresh.xp_multiplier) || 1;
    fresh.gem_multiplier = Number(fresh.gem_multiplier) || 1;
    publish(fresh);
    AsyncStorage.setItem(KEY, JSON.stringify(fresh)).catch(() => {});
    return fresh;
  } catch {
    return getBuffs();
  }
};

/** Forget buffs (log out / account deleted). */
export const clearBuffs = async () => {
  publish(NO_BUFFS);
  await AsyncStorage.removeItem(KEY).catch(() => {});
};

/** A time-limited boost only counts while it's on. */
export const civicXpMultiplier = (b: Buffs, now = Date.now()) =>
  b.civic_boost_until && new Date(b.civic_boost_until).getTime() > now ? b.civic_xp_multiplier : 1;

export const useBuffs = (): Buffs => {
  const [buffs, setBuffs] = useState<Buffs>(cache ?? NO_BUFFS);
  useEffect(() => {
    let alive = true;
    listeners.add(setBuffs);
    getBuffs().then((b) => alive && setBuffs(b));
    return () => {
      alive = false;
      listeners.delete(setBuffs);
    };
  }, []);
  return buffs;
};

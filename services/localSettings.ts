import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/**
 * Settings that live on this phone only (AsyncStorage), never in the cloud.
 *
 * Privacy Zones belong here by design: storing "where I live" on a server
 * would leak the very thing the zone is meant to hide. The rest (reminder
 * time, keep screen on) are per-device choices, like most apps keep them.
 */

export interface PrivacyZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface LocalSettings {
  /** Keep the screen from sleeping while a run is being tracked. */
  keepScreenOn: boolean;
  /** Daily movement reminder (a local notification). */
  reminderEnabled: boolean;
  /** Hour of the reminder, 24h clock. Always outside Quiet Hours. */
  reminderHour: number;
  privacyZones: PrivacyZone[];
}

/** aboutkarela.md "User Privacy Controls": up to 5 zones, 100 m radius. */
export const MAX_PRIVACY_ZONES = 5;
export const PRIVACY_ZONE_RADIUS_M = 100;

/** aboutkarela.md "Notification Architecture": Quiet Hours 10 PM to 7 AM. */
export const QUIET_HOURS = { start: 22, end: 7 };
/** Reminder hours a user can pick: every hour outside Quiet Hours. */
export const REMINDER_HOURS = Array.from(
  { length: QUIET_HOURS.start - QUIET_HOURS.end },
  (_, i) => QUIET_HOURS.end + i,
);

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  keepScreenOn: false,
  reminderEnabled: false,
  reminderHour: 17,
  privacyZones: [],
};

const KEY = "karela.localSettings.v1";

let cache: LocalSettings | null = null;
const listeners = new Set<(s: LocalSettings) => void>();

const sanitize = (raw: any): LocalSettings => {
  const s = { ...DEFAULT_LOCAL_SETTINGS, ...(raw || {}) };
  if (!REMINDER_HOURS.includes(s.reminderHour)) s.reminderHour = DEFAULT_LOCAL_SETTINGS.reminderHour;
  s.privacyZones = Array.isArray(s.privacyZones)
    ? s.privacyZones
        .filter((z: any) => Number.isFinite(z?.latitude) && Number.isFinite(z?.longitude))
        .slice(0, MAX_PRIVACY_ZONES)
    : [];
  return s;
};

export const getLocalSettings = async (): Promise<LocalSettings> => {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = sanitize(raw ? JSON.parse(raw) : null);
  } catch (e) {
    console.warn("Local settings read failed, using defaults:", e);
    cache = { ...DEFAULT_LOCAL_SETTINGS };
  }
  return cache;
};

export const updateLocalSettings = async (
  patch: Partial<LocalSettings>,
): Promise<LocalSettings> => {
  const next = sanitize({ ...(await getLocalSettings()), ...patch });
  cache = next;
  listeners.forEach((l) => l(next));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
};

/** Forget every on-phone setting (used when the account is deleted). */
export const clearLocalSettings = async () => {
  cache = { ...DEFAULT_LOCAL_SETTINGS };
  listeners.forEach((l) => l(cache!));
  await AsyncStorage.removeItem(KEY);
};

/** Live view of the local settings; null until the first read finishes. */
export const useLocalSettings = () => {
  const [settings, setSettings] = useState<LocalSettings | null>(cache);

  useEffect(() => {
    let alive = true;
    listeners.add(setSettings);
    getLocalSettings().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
      listeners.delete(setSettings);
    };
  }, []);

  return settings;
};

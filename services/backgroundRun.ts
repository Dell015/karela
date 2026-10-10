import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { AppState } from "react-native";

import { db } from "@/services/database/sqlite/database";
import { getLocalSettings, PrivacyZone } from "@/services/localSettings";
import { isInPrivacyZone } from "@/services/privacyZones";
import { KARELA } from "@/styles/designSystem";

/**
 * Run tracking with the screen locked (QA C6).
 *
 * While a run is going, a background location task (Android: a foreground
 * service with a "Karela is recording your run" notification) receives GPS
 * fixes. While the app is in front, the run screen's own GPS watcher records
 * the trail, so the task ignores those fixes; when the app is in the
 * background, the task saves them to the SQLite table run_points. Coming
 * back, the run screen adds them to the trail (useLocationEngine).
 *
 * Privacy: fixes inside a Privacy Zone are dropped before anything is
 * written, the same rule as every other route on the phone.
 *
 * Needs a development build or a store build. Expo Go has no background
 * tasks (TaskManager isn't available on Android there and doesn't run in
 * the background on iOS); the run screen then works as before, with the
 * screen on.
 *
 * The task must be defined when the app's JavaScript loads, including when
 * Android starts it without the UI, so app/_layout.tsx imports this file.
 */

export const RUN_LOCATION_TASK = "karela-run-location";

/** Same strict gate the run screen uses for the trail (useLocationEngine). */
const ACCURACY_GATE_M = 20;

export type BackgroundPoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number;
};

let zones: PrivacyZone[] | null = null;
const loadZones = async () => {
  if (zones) return zones;
  try {
    zones = (await getLocalSettings()).privacyZones;
  } catch {
    zones = [];
  }
  return zones;
};

if (!TaskManager.isTaskDefined(RUN_LOCATION_TASK)) {
  TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(RUN_LOCATION_TASK, async ({ data, error }) => {
    if (error || !data?.locations?.length) return;
    // In front, the run screen records these itself.
    if (AppState.currentState === "active") return;
    const z = await loadZones();
    try {
      for (const loc of data.locations) {
        const { latitude, longitude, accuracy, speed } = loc.coords;
        if (accuracy == null || accuracy > ACCURACY_GATE_M) continue;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
        if (isInPrivacyZone({ latitude, longitude }, z)) continue;
        db.runSync("INSERT INTO run_points (ts, latitude, longitude, speed) VALUES (?, ?, ?, ?)", [
          loc.timestamp || Date.now(),
          latitude,
          longitude,
          speed && speed > 0 ? speed : 0,
        ]);
      }
    } catch (e) {
      console.warn("Background run: point not saved:", e);
    }
  });
}

/**
 * Starts recording in the background for a new run. Returns false (and the
 * run carries on with the screen on, as before) when it can't: Expo Go, no
 * "Allow all the time" location permission, or location off.
 */
export const startBackgroundTracking = async (): Promise<boolean> => {
  try {
    if (!(await TaskManager.isAvailableAsync())) return false;
    if (!(await Location.isBackgroundLocationAvailableAsync())) return false;
    if ((await Location.getBackgroundPermissionsAsync()).status !== "granted") return false;

    db.runSync("DELETE FROM run_points");
    zones = null; // pick up zones added since the last run
    await loadZones();
    if (await Location.hasStartedLocationUpdatesAsync(RUN_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(RUN_LOCATION_TASK);
    }
    await Location.startLocationUpdatesAsync(RUN_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 2,
      timeInterval: 1000,
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Karela is recording your run",
        notificationBody: "Your route stays on this phone. Open Karela to end the run.",
        notificationColor: KARELA.color.brand,
        // A force-closed app shouldn't keep using GPS. The run so far is
        // kept and offered back the next time the map opens.
        killServiceOnDestroy: true,
      },
    });
    return true;
  } catch (e) {
    console.warn("Background run tracking not started:", e);
    return false;
  }
};

export const stopBackgroundTracking = async () => {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(RUN_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(RUN_LOCATION_TASK);
    }
  } catch (e) {
    console.warn("Background run tracking not stopped:", e);
  }
};

/** Points recorded in the background since the last call, oldest first. They're removed. */
export const takeBackgroundPoints = (): BackgroundPoint[] => {
  try {
    const rows = db.getAllSync<{ ts: number; latitude: number; longitude: number; speed: number }>(
      "SELECT ts, latitude, longitude, speed FROM run_points ORDER BY ts",
    );
    if (rows.length) db.runSync("DELETE FROM run_points WHERE ts <= ?", [rows[rows.length - 1].ts]);
    return rows.map((r) => ({ latitude: r.latitude, longitude: r.longitude, timestamp: r.ts, speed: r.speed }));
  } catch {
    return [];
  }
};

export const clearBackgroundPoints = () => {
  try {
    db.runSync("DELETE FROM run_points");
  } catch {}
};

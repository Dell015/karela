import { PermissionManager } from "@/services/PermissionsManager";
import { VEHICLE_KMH } from "@/services/runMath";
import {
  clearBackgroundPoints,
  startBackgroundTracking,
  stopBackgroundTracking,
  takeBackgroundPoints,
} from "@/services/backgroundRun";
import { GhostEngine } from "@/services/tracker/GhostEngine";
import { GpsKalmanFilter } from "@/services/tracker/GpsKalmanFilter";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useMotionShield } from "./useMotionShield";

const getDistance = (
  p1: { latitude: number; longitude: number },
  p2: { latitude: number; longitude: number },
) => {
  const R = 6371000;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useLocationEngine = (savedGhostData: any[]) => {
  const { isPhysicallyMoving, stepCount } = useMotionShield();

  const [path, setPath] = useState<
    { latitude: number; longitude: number; isVehicle: boolean; timestamp: number }[]
  >([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const raceStartTimeRef = useRef<number | null>(null);
  const lastHeadingRef = useRef(0);
  const isRacingRef = useRef(isRacing);
  const isMovingRef = useRef(isPhysicallyMoving);
  const kalmanRef = useRef(new GpsKalmanFilter(3));
  const lastAcceptedRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);

  // --- TUNING CONSTANTS ---
  const DISPLAY_ACCURACY_M = 50;     // Looser gate for map display
  const ACCURACY_GATE_M = 20;        // Strict gate for run-path recording
  const JITTER_THRESHOLD = 2.5;      // Min movement to register (meters)
  const TELEPORT_THRESHOLD = 100;    // Max plausible jump per fix (meters)
  const MAX_HUMAN_SPEED_MPS = 12.5;  // ~45 km/h — rejects GPS spikes
  const VELOCITY_CAP = VEHICLE_KMH;  // km/h — flags vehicle travel
  const GPS_HEADING_MIN_SPEED = 2;   // m/s — use GPS course above this speed

  // Keep refs in sync with the latest props. This must run on every change,
  // but must NOT reset run state — hence it is separate from the effect below.
  useEffect(() => {
    isRacingRef.current = isRacing;
  }, [isRacing]);

  useEffect(() => {
    isMovingRef.current = isPhysicallyMoving;
  }, [isPhysicallyMoving]);

  type Fix = { latitude: number; longitude: number; timestamp: number };
  type TrailPoint = Fix & { isVehicle: boolean };

  /**
   * The checks every trail point goes through, live or recorded in the
   * background: jitter, impossible jumps and vehicle speed. Returns the
   * point to add, or null. Updates the last accepted point and the total.
   */
  const acceptPoint = (point: Fix, speedMps: number): TrailPoint | null => {
    const speedKmH = speedMps > 0 ? Math.round(speedMps * 3.6) : 0;
    const isVehicle = speedKmH > VELOCITY_CAP;
    const last = lastAcceptedRef.current;
    if (!last) {
      lastAcceptedRef.current = point;
      return { ...point, isVehicle };
    }

    const distanceMoved = getDistance(last, point);
    const dtSeconds = Math.max(0.001, (point.timestamp - last.timestamp) / 1000);
    const impliedSpeed = distanceMoved / dtSeconds; // m/s

    // OUTLIER REJECTION
    //    - Too small: GPS jitter while standing still
    //    - Too large: GPS spike / teleport
    //    - Implausible speed: faster than a human can move on foot
    if (distanceMoved < JITTER_THRESHOLD) return null;
    if (distanceMoved > TELEPORT_THRESHOLD) return null;
    if (impliedSpeed > MAX_HUMAN_SPEED_MPS && !isVehicle) return null;

    lastAcceptedRef.current = point;

    // DISTANCE ACCUMULATION — only count human-powered movement
    if (!isVehicle && isMovingRef.current) {
      setTotalDistance((prev) => prev + distanceMoved);
    }
    return { ...point, isVehicle };
  };

  // --- SCREEN LOCKED: points recorded in the background (services/backgroundRun.ts) ---
  // Added to the trail when the app comes back to the front. In Expo Go
  // background tracking doesn't start, and this finds nothing.
  const wasInBackgroundRef = useRef(false);
  const mergeBackgroundPoints = () => {
    if (!wasInBackgroundRef.current) return;
    wasInBackgroundRef.current = false;
    const added: TrailPoint[] = [];
    for (const p of takeBackgroundPoints()) {
      const last = lastAcceptedRef.current;
      if (last && p.timestamp <= last.timestamp) continue;
      const accepted = acceptPoint({ latitude: p.latitude, longitude: p.longitude, timestamp: p.timestamp }, p.speed);
      if (accepted) added.push(accepted);
    }
    if (added.length) setPath((current) => [...current, ...added]);
  };

  useEffect(() => {
    if (!isRacing) return;
    let stopped = false;
    void startBackgroundTracking().then((on) => {
      if (stopped && on) void stopBackgroundTracking();
    });
    const sub = AppState.addEventListener("change", (st) => {
      if (st === "active") mergeBackgroundPoints();
      else wasInBackgroundRef.current = true;
    });
    return () => {
      stopped = true;
      sub.remove();
      wasInBackgroundRef.current = false;
      void stopBackgroundTracking();
      clearBackgroundPoints();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRacing]);

  // Reset run state ONLY when the race itself starts/stops.
  // Depending on isPhysicallyMoving here would wipe `path` and restart the
  // ghost clock on every mid-run pause detected by useMotionShield.
  useEffect(() => {
    if (isRacing) {
      raceStartTimeRef.current = Date.now();
      setTotalDistance(0);
      setPath([]);
      // Don't reset kalmanRef — we want currentLocation to stay visible
      // Only reset the path-recording reference
      lastAcceptedRef.current = null;
    } else {
      raceStartTimeRef.current = null;
      setGhostPosition(null);
    }
  }, [isRacing]);

  // --- GHOST ENGINE (FIXED SYNC) ---
  useEffect(() => {
    let ghostTimer: any;

    if (isRacing && savedGhostData && savedGhostData.length > 0) {
      ghostTimer = setInterval(() => {
        if (!raceStartTimeRef.current) return;
        const userElapsedMs = Date.now() - raceStartTimeRef.current;
        const pos = GhostEngine.getGhostPosition(savedGhostData, userElapsedMs);
        if (pos) {
          setGhostPosition({ latitude: pos.latitude, longitude: pos.longitude });
        }
      }, 250); // 4 updates a second: smooth enough, and each one re-renders the map
    }

    return () => clearInterval(ghostTimer);
  }, [isRacing, savedGhostData]);

  // --- LOCATION TRACKING ---
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    // If the component unmounts before watchPositionAsync resolves, the cleanup
    // below would see `subscription === null` and the watcher would leak forever.
    let cancelled = false;

    const initLocation = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed || cancelled) return;

      const sub = await Location.watchPositionAsync(
        {
          // Always use high accuracy — the display gate handles low-quality fixes
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 2,
          timeInterval: 1000,
        },
        (location) => {
          const { latitude, longitude, speed, accuracy, heading } = location.coords;
          const gpsTimestamp = location.timestamp || Date.now();

          // 1. DISPLAY GATE — accept looser fixes so the map can always show a location
          if (accuracy == null || accuracy > DISPLAY_ACCURACY_M) return;

          // 2. KALMAN FILTER — accuracy-weighted smoothing
          // Adapt process noise to current speed (walking vs running vs sprinting)
          const rawSpeedMps = speed && speed > 0 ? speed : 0;
          kalmanRef.current.setProcessNoise(
            rawSpeedMps > 4 ? 5 : rawSpeedMps > 2 ? 3 : 1.5,
          );
          const filtered = kalmanRef.current.process(
            latitude,
            longitude,
            accuracy,
            gpsTimestamp,
          );

          const filteredPoint = {
            latitude: filtered.latitude,
            longitude: filtered.longitude,
            timestamp: gpsTimestamp,
          };

          setCurrentLocation(filteredPoint);
          setGpsAccuracy(filtered.accuracy);

          // GPS course is more reliable than magnetometer when moving fast
          if (heading != null && heading >= 0 && rawSpeedMps > GPS_HEADING_MIN_SPEED) {
            setCompassHeading(heading);
            lastHeadingRef.current = heading;
          }

          if (!isRacingRef.current) return;

          // 3. STRICT GATE — only record run path from high-accuracy fixes
          if (accuracy > ACCURACY_GATE_M) return;

          setCurrentSpeed(rawSpeedMps > 0 ? Math.round(rawSpeedMps * 3.6) : 0);

          // Coming back from the background: add what was recorded there
          // first, so the trail stays in time order.
          mergeBackgroundPoints();

          // 4. OUTLIER REJECTION and distance (acceptPoint)
          const accepted = acceptPoint(filteredPoint, rawSpeedMps);
          if (accepted) setPath((current) => [...current, accepted]);
        },
      );

      // Unmounted while awaiting — discard immediately instead of leaking.
      if (cancelled) {
        sub.remove();
        return;
      }
      subscription = sub;
    };

    initLocation();
    return () => {
      cancelled = true;
      subscription?.remove();
      subscription = null;
    };
    // One watcher for the screen's life. acceptPoint and mergeBackgroundPoints
    // only use refs and state setters, so the first render's copies are fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- COMPASS (Magnetometer fallback for low-speed / stationary) ---
  // Throttled on purpose: every heading update re-renders the whole run
  // screen (map, trail, zones). At the sensor's default rate that kept the
  // JS thread so busy the run timer stopped updating.
  const shownHeadingRef = useRef(0);
  useEffect(() => {
    if (!isRacing) return;
    Magnetometer.setUpdateInterval(250); // 4 readings a second is plenty
    const sub = Magnetometer.addListener((data) => {
      const { x, y } = data;
      let angle = Math.atan2(-x, y) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      // Low-pass filter along the shortest way round, so 359 -> 1 degree
      // moves 2 degrees instead of swinging back through 180.
      const delta = ((angle - lastHeadingRef.current + 540) % 360) - 180;
      const smoothed = (lastHeadingRef.current + delta * 0.2 + 360) % 360;
      lastHeadingRef.current = smoothed;
      // Only re-render when the heading really changed.
      const shownDelta = Math.abs(((smoothed - shownHeadingRef.current + 540) % 360) - 180);
      if (shownDelta >= 3) {
        shownHeadingRef.current = smoothed;
        setCompassHeading(smoothed);
      }
    });
    return () => sub.remove();
  }, [isRacing]);

  return {
    path,
    totalDistance,
    ghostPosition,
    isRacing,
    setIsRacing,
    currentLocation,
    currentSpeed,
    compassHeading,
    gpsAccuracy,
    setPath,
  };
};

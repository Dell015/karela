import { PermissionManager } from "@/services/PermissionsManager";
import { GhostEngine } from "@/services/tracker/GhostEngine";
import { GpsKalmanFilter } from "@/services/tracker/GpsKalmanFilter";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
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
  const kalmanRef = useRef(new GpsKalmanFilter(3));
  const lastAcceptedRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);

  // --- TUNING CONSTANTS ---
  const DISPLAY_ACCURACY_M = 50;     // Looser gate for map display
  const ACCURACY_GATE_M = 20;        // Strict gate for run-path recording
  const JITTER_THRESHOLD = 2.5;      // Min movement to register (meters)
  const TELEPORT_THRESHOLD = 100;    // Max plausible jump per fix (meters)
  const MAX_HUMAN_SPEED_MPS = 12.5;  // ~45 km/h — rejects GPS spikes
  const VELOCITY_CAP = 35;           // km/h — flags vehicle travel
  const GPS_HEADING_MIN_SPEED = 2;   // m/s — use GPS course above this speed

  useEffect(() => {
    isRacingRef.current = isRacing;
    if (isRacing) {
      raceStartTimeRef.current = Date.now();
      setTotalDistance(0);
      setPath([]);
      kalmanRef.current.reset();
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
      }, 100);
    }

    return () => clearInterval(ghostTimer);
  }, [isRacing, savedGhostData]);

  // --- LOCATION TRACKING ---
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;

      subscription = await Location.watchPositionAsync(
        {
          // BestForNavigation gives the highest-precision fixes during a race
          accuracy: isRacing
            ? Location.Accuracy.BestForNavigation
            : Location.Accuracy.Balanced,
          distanceInterval: isRacing ? 2 : 10,
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

          const speedKmH = rawSpeedMps > 0 ? Math.round(rawSpeedMps * 3.6) : 0;
          setCurrentSpeed(speedKmH);
          const isVehicle = speedKmH > VELOCITY_CAP;

          const last = lastAcceptedRef.current;

          if (!last) {
            lastAcceptedRef.current = filteredPoint;
            setPath([{ ...filteredPoint, isVehicle }]);
            return;
          }

          const distanceMoved = getDistance(last, filteredPoint);
          const dtSeconds = Math.max(0.001, (gpsTimestamp - last.timestamp) / 1000);
          const impliedSpeed = distanceMoved / dtSeconds; // m/s

          // 3. OUTLIER REJECTION
          //    - Too small: GPS jitter while standing still
          //    - Too large: GPS spike / teleport
          //    - Implausible speed: faster than a human can move on foot
          if (distanceMoved < JITTER_THRESHOLD) return;
          if (distanceMoved > TELEPORT_THRESHOLD) return;
          if (impliedSpeed > MAX_HUMAN_SPEED_MPS && !isVehicle) return;

          lastAcceptedRef.current = filteredPoint;

          // 4. DISTANCE ACCUMULATION — only count human-powered movement
          if (!isVehicle && isPhysicallyMoving) {
            setTotalDistance((prev) => prev + distanceMoved);
          }

          setPath((current) => [...current, { ...filteredPoint, isVehicle }]);
        },
      );
    };

    initLocation();
    return () => subscription?.remove();
  }, [isRacing, isPhysicallyMoving]);

  // --- COMPASS (Magnetometer fallback for low-speed / stationary) ---
  useEffect(() => {
    if (!isRacing) return;
    const sub = Magnetometer.addListener((data) => {
      const { x, y } = data;
      let angle = Math.atan2(-x, y) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      // Low-pass filter to reduce magnetometer jitter
      const smoothed =
        lastHeadingRef.current + (angle - lastHeadingRef.current) * 0.1;
      lastHeadingRef.current = smoothed;
      setCompassHeading(smoothed);
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

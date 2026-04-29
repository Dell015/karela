import { PermissionManager } from "@/services/PermissionsManager";
import { GhostEngine } from "@/services/tracker/GhostEngine";
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

  const [path, setPath] = useState<{ latitude: number; longitude: number; isVehicle: boolean; timestamp: number }[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);

  const raceStartTimeRef = useRef<number | null>(null);
  const lastHeadingRef = useRef(0);
  const isRacingRef = useRef(isRacing);

  const VELOCITY_CAP = 35;
  const JITTER_THRESHOLD = 3; 
  const TELEPORT_THRESHOLD = 100;
  const SMOOTHING_WEIGHT = 0.75; 

  useEffect(() => {
    isRacingRef.current = isRacing;
    if (isRacing) {
      raceStartTimeRef.current = Date.now();
      setTotalDistance(0);
      setPath([]);
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

        // How many MS have passed since YOU hit start
        const userElapsedMs = Date.now() - raceStartTimeRef.current;

        // Get ghost position relative to your progress
        const pos = GhostEngine.getGhostPosition(savedGhostData, userElapsedMs);

        if (pos) {
          setGhostPosition({
            latitude: pos.latitude,
            longitude: pos.longitude,
          });
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
          accuracy: isRacing ? Location.Accuracy.High : Location.Accuracy.Balanced,
          distanceInterval: 4, 
          timeInterval: 1000,
        },
        (location) => {
          const { latitude, longitude, speed, accuracy } = location.coords;
          if (accuracy && accuracy > 35) return;

          const rawPoint = { latitude, longitude, timestamp: Date.now() };
          setCurrentLocation(rawPoint);

          if (isRacingRef.current) {
            const speedKmH = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
            setCurrentSpeed(speedKmH);
            const isVehicle = speedKmH > VELOCITY_CAP;

            setPath((current) => {
              if (current.length === 0) return [{ ...rawPoint, isVehicle }];

              const lastPoint = current[current.length - 1];

              // SMOOTHING
              const smoothedPoint = {
                latitude: lastPoint.latitude * (1 - SMOOTHING_WEIGHT) + rawPoint.latitude * SMOOTHING_WEIGHT,
                longitude: lastPoint.longitude * (1 - SMOOTHING_WEIGHT) + rawPoint.longitude * SMOOTHING_WEIGHT,
                isVehicle,
                timestamp: Date.now()
              };

              const distanceMoved = getDistance(lastPoint, smoothedPoint);

              if (distanceMoved < JITTER_THRESHOLD || distanceMoved > TELEPORT_THRESHOLD) return current;

              if (!isVehicle && isPhysicallyMoving) {
                setTotalDistance((prev) => prev + distanceMoved);
              }

              return [...current, smoothedPoint];
            });
          }
        }
      );
    };

    initLocation();
    return () => subscription?.remove();
  }, [isRacing, isPhysicallyMoving]);

  // --- COMPASS ---
  useEffect(() => {
    if (!isRacing) return;
    const sub = Magnetometer.addListener((data) => {
      let { x, y } = data;
      let angle = Math.atan2(-x, y) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      const smoothed = lastHeadingRef.current + (angle - lastHeadingRef.current) * 0.1;
      lastHeadingRef.current = smoothed;
      setCompassHeading(smoothed);
    });
    return () => sub.remove();
  }, [isRacing]);

  return { path, totalDistance, ghostPosition, isRacing, setIsRacing, currentLocation, currentSpeed, compassHeading, setPath };
};
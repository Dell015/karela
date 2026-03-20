import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { GhostEngine } from "@/services/tracker/GhostEngine";
import { PermissionManager } from "@/services/PermissionsManager";
import { Magnetometer } from "expo-sensors";

/**
 * Helper: Haversine formula to calculate distance between two points in meters.
 */
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
  const [path, setPath] = useState<{latitude: number; longitude: number; isVehicle: boolean}[]>([]);
  const [ghostPosition, setGhostPosition] = useState<any>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [compassHeading, setCompassHeading] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  
  const lastHeadingRef = useRef(0);
  const isRacingRef = useRef(isRacing);
  const VELOCITY_CAP = 35; // KM/H threshold for Anti-Cheat

  // Sync ref with state for use inside listeners without causing re-renders
  useEffect(() => {
    isRacingRef.current = isRacing;
    if (isRacing) {
      setTotalDistance(0);
      setPath([]);
    }
  }, [isRacing]);

  // 1. GHOST TIMER - Only runs if isRacing is TRUE
  useEffect(() => {
    if (!isRacing || !savedGhostData || savedGhostData.length === 0) {
      setGhostPosition(null);
      return;
    }

    const startTime = Date.now();
    const ghostTimer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pos = GhostEngine.getGhostPosition(savedGhostData, elapsed);
      setGhostPosition(pos);
    }, 100); // 10Hz is plenty for UI smoothness

    return () => clearInterval(ghostTimer);
  }, [isRacing, savedGhostData]);

  // 2. LOCATION SUBSCRIPTION - Dynamic Accuracy Based on State
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      const isAllowed = await PermissionManager.requestLocation();
      if (!isAllowed) return;

      subscription = await Location.watchPositionAsync(
        {
          // Optimization: Use lower accuracy when not racing to save CPU/Battery
          accuracy: isRacing ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced,
          distanceInterval: isRacing ? 2 : 15, 
          timeInterval: isRacing ? 1000 : 5000, 
        },
        (location) => {
          const { latitude, longitude, speed, accuracy } = location.coords;

          // Philippine GPS Signal Filter: Accuracy > 35m is usually a "jump" or "glitch"
          if (accuracy && accuracy > 35) return;

          const newPoint = { latitude, longitude };
          setCurrentLocation(newPoint);

          if (isRacingRef.current) {
            const speedKmH = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
            setCurrentSpeed(speedKmH);
            const isVehicle = speedKmH > VELOCITY_CAP;

            setPath((current) => {
              const pointWithStatus = { ...newPoint, isVehicle };
              if (current.length === 0) return [pointWithStatus];

              const lastPoint = current[current.length - 1];
              const distanceMoved = getDistance(lastPoint, newPoint);

              // Filtering jitter (Stationary < 3m, Teleport > 40m)
              if (distanceMoved < 3 || distanceMoved > 40) return current;

              if (!isVehicle) {
                setTotalDistance((prev) => prev + distanceMoved);
              }

              return [...current, pointWithStatus];
            });
          }
        }
      );
    };

    initLocation();
    return () => {
      if (subscription) subscription.remove();
    };
  }, [isRacing]); // Re-subscribes with new accuracy mode when racing starts/stops

  // 3. COMPASS (Magnetometer) - Only active during Race
  useEffect(() => {
    if (!isRacing) {
        setCompassHeading(0);
        return;
    }

    let magnetSubscription: any = null;
    Magnetometer.setUpdateInterval(200); // Relaxed from 150ms

    magnetSubscription = Magnetometer.addListener((data) => {
      let { x, y } = data;
      let angle = Math.atan2(-x, y) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      // Low-pass filter for smoothness
      const alpha = 0.1; 
      const smoothedAngle = lastHeadingRef.current + (angle - lastHeadingRef.current) * alpha;

      lastHeadingRef.current = smoothedAngle;
      setCompassHeading(smoothedAngle);
    });

    return () => {
      if (magnetSubscription) magnetSubscription.remove();
    };
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
    setPath
  };
};
// src/utils/geoUtils.ts

import { MapCoordinate } from "@/services/tracker/routingService";

/**
 * Calculates the distance between two GPS coordinates using the Haversine formula.
 * @returns Distance in meters
 */
export const calculateDistance = (point1: MapCoordinate, point2: MapCoordinate): number => {
  const R = 6371e3; // Earth's radius in meters
  const lat1 = point1.latitude;
  const lon1 = point1.longitude;
  const lat2 = point2.latitude;
  const lon2 = point2.longitude;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
};

/**
 * Converts meters into CO2 grams saved (approximate).
 */
export const calculateCO2Saved = (meters: number): number => {
    // Average car emits ~120g/km. 120g / 1000m = 0.12g per meter.
    return +(meters * 0.12).toFixed(2);
};
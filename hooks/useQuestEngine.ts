import {
  MapCoordinate,
  getMultiPointRoute,
  snapToRoad,
} from "@/services/tracker/routingService";
import { useState } from "react";
import MapView from "react-native-maps";

// ~100 meters tolerance for PH shortcuts and GPS drift
const OFF_TRACK_THRESHOLD = 0.001; 
// ~15 meters for quest completion
const COMPLETION_THRESHOLD = 0.00015;

export const useQuestEngine = (mapRef: React.RefObject<MapView | null>) => {
  const [checkpoints, setCheckpoints] = useState<MapCoordinate[]>([]);
  const [questPath, setQuestPath] = useState<MapCoordinate[]>([]);
  const [questRewards, setQuestRewards] = useState<{
    coins: number;
    xp: number;
  } | null>(null);

  // UI Interaction States
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [totalDistance, setTotalDistance] = useState<number>(0);

  /**
   * Real-time path updates: Handles "eating" the path, 
   * off-road stretching, and quest completion.
   */
  const updateRemainingPath = (userLoc: MapCoordinate) => {
    setQuestPath((currentPath) => {
      if (currentPath.length === 0) return currentPath;

      let closestIndex = 0;
      let minDistance = Number.MAX_VALUE;

      // Find the closest point on the current path
      currentPath.forEach((point, index) => {
        const dist = Math.sqrt(
          Math.pow(point.latitude - userLoc.latitude, 2) +
          Math.pow(point.longitude - userLoc.longitude, 2)
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = index;
        }
      });

      // 1. QUEST COMPLETION
      // If we are at the final segment and close to the end
      if (currentPath.length <= 2 && minDistance < COMPLETION_THRESHOLD) {
        console.log("Quest Complete!");
        setCheckpoints([]); // Clear the flags
        return []; // Clear the gold line
      }

      // 2. FORGIVING OFF-TRACK / SHORTCUT LOGIC
      // If user is far from the road, "rubber-band" the line to the user
      if (minDistance > OFF_TRACK_THRESHOLD) {
        return [userLoc, ...currentPath.slice(closestIndex)];
      }

      // 3. NORMAL PROGRESSION
      if (closestIndex > 0) {
        return currentPath.slice(closestIndex);
      }
      
      return currentPath;
    });
  };

  /**
   * Re-calculates the route whenever checkpoints or user location changes.
   */
  const refreshRoute = async (
    userLoc: MapCoordinate | null,
    points: MapCoordinate[],
  ) => {
    if (userLoc && points.length > 0) {
      const data = await getMultiPointRoute([userLoc, ...points]);
      if (data) {
        setQuestPath(data.coordinates);
        setQuestRewards(data.rewards);
        setTotalDistance(data.distanceMeters);
      }
    } else {
      setQuestPath([]);
      setQuestRewards(null);
      setTotalDistance(0);
    }
  };

  const addCheckpoint = (
    coords: { latitude: number; longitude: number },
    userLoc: MapCoordinate | null,
  ) => {
    const newPoint = {
      ...coords,
      id: Math.random().toString(36).substring(7),
    };
    const updated = [...checkpoints, newPoint];
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  const deleteCheckpoint = (index: number, userLoc: MapCoordinate | null) => {
    const updated = checkpoints.filter((_, i) => i !== index);
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  const moveCheckpoint = async (
    index: number,
    newCoords: any,
    userLoc: any,
  ) => {
    const snapped = await snapToRoad(newCoords.latitude, newCoords.longitude);
    const updated = [...checkpoints];
    updated[index] = {
      ...updated[index],
      ...snapped,
    };

    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  const changeCameraHeading = (direction: "N" | "S" | "E" | "W") => {
    let heading = 0;
    switch (direction) {
      case "N": heading = 0; break;
      case "E": heading = 90; break;
      case "S": heading = 180; break;
      case "W": heading = 270; break;
    }

    mapRef.current?.animateCamera(
      { heading: heading, pitch: 45 },
      { duration: 1000 },
    );
  };

  return {
    checkpoints,
    questPath,
    questRewards,
    totalDistance,
    isDragging,
    setIsDragging,
    isOverTrash,
    setIsOverTrash,
    addCheckpoint,
    deleteCheckpoint,
    moveCheckpoint,
    changeCameraHeading,
    updateRemainingPath,
  };
};
import {
  MapCoordinate,
  getMultiPointRoute,
  snapToRoad,
} from "@/services/tracker/routingService";
import { useState } from "react";
import MapView from "react-native-maps";

/**
 * useQuestEngine
 * Handles the logic for creating, moving, and deleting quest checkpoints.
 * Manages route calculation and real-time UI interaction states.
 */
export const useQuestEngine = (mapRef: React.RefObject<MapView | null>) => {
  const [checkpoints, setCheckpoints] = useState<MapCoordinate[]>([]);
  const [questPath, setQuestPath] = useState<MapCoordinate[]>([]);
  const [questRewards, setQuestRewards] = useState<{
    coins: number;
    xp: number;
  } | null>(null);
  
  // UI Interaction States
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false); // NEW: Tracks hover status for deletion zone
  const [totalDistance, setTotalDistance] = useState<number>(0);

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

  /**
   * Spawns a new checkpoint at a specific coordinate.
   */
  const addCheckpoint = (
    coords: { latitude: number; longitude: number },
    userLoc: any,
  ) => {
    const newPoint = {
      ...coords,
      id: Math.random().toString(36).substring(7),
    };
    const updated = [...checkpoints, newPoint];
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  /**
   * Removes a checkpoint from the array by index.
   */
  const deleteCheckpoint = (index: number, userLoc: MapCoordinate | null) => {
    const updated = checkpoints.filter((_, i) => i !== index);
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
  };

  /**
   * Updates checkpoint position and snaps it to the nearest road via OSRM.
   */
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

  /**
   * Smoothly animates the Map Camera to a specific cardinal direction.
   */
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
      { duration: 1000 }
    );
  };

  return {
    checkpoints,
    questPath,
    questRewards,
    totalDistance,
    isDragging,
    setIsDragging,
    isOverTrash,     // Exported to trigger UI changes in MapScreen
    setIsOverTrash,  // Exported to update state during active drag
    addCheckpoint,
    deleteCheckpoint,
    moveCheckpoint,
    changeCameraHeading,
  };
};
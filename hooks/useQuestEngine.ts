import { useState } from "react";
import {
    MapCoordinate,
    getMultiPointRoute,
    snapToRoad,
} from "@/services/tracker/routingService";

export const useQuestEngine = () => {
    const [checkpoints, setCheckpoints] = useState<MapCoordinate[]>([]);
    const [questPath, setQuestPath] = useState<MapCoordinate[]>([]);
    const [questRewards, setQuestRewards] = useState<{
        coins: number;
        xp: number;
    } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const refreshRoute = async (
        userLoc: MapCoordinate | null,
        points: MapCoordinate[],
    ) => {
        if (userLoc && points.length > 0) {
            const data = await getMultiPointRoute([userLoc, ...points]);
            if (data) {
                setQuestPath(data.coordinates);
                setQuestRewards(data.rewards);
            }
        } else {
            setQuestPath([]);
            setQuestRewards(null);
        }
    };

    const addCheckpoint = (
        coords: { latitude: number; longitude: number },
        userLoc: any,
    ) => {
        const newPoint = {
            ...coords,
            id: Math.random().toString(36).substring(7), // Generate the missing ID
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

    const moveCheckpoint = async (index: number, newCoords: any, userLoc: any) => {
    // 1. Get the snapped coordinate
    const snapped = await snapToRoad(newCoords.latitude, newCoords.longitude);
    
    const updated = [...checkpoints];
    updated[index] = {
        ...updated[index],
        ...snapped // Use snapped coords instead of raw drop coords
    };
    
    setCheckpoints(updated);
    refreshRoute(userLoc, updated);
    };

    return {
        checkpoints,
        questPath,
        questRewards,
        isDragging,
        setIsDragging,
        addCheckpoint,
        deleteCheckpoint,
        moveCheckpoint,
    };
};

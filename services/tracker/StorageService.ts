import AsyncStorage from '@react-native-async-storage/async-storage';
import { GhostPoint } from './GhostEngine';

// We give our "Save Slot" a name
const STORAGE_KEY = '@latest_run_data';

/**
 * SAVE: Takes our array of points and shoves them into the phone's memory.
 */
export const saveRun = async (points: GhostPoint[]) => {
    try {
        // AsyncStorage only saves STrings.
        // We must turn our Array into a JSON string first.
        const jsonValue = JSON.stringify(points);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
        console.log("Run saved to disk!")
    } catch (e) {
        console.error("Failed to save run", e);
    }
};

/**
 * LOAD: Grabs the string from memory and turns it back into an Array.
 */

export const loadRun = async (): Promise<GhostPoint[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        // If we find something, turn it back into an object. If not, return empty [].
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error("Failed to load run", e);
        return [];
    }
};


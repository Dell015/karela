import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { GhostPoint } from './GhostEngine';


let pathData: GhostPoint[] = [];        // A list to hold every point of the run
let totalDistance = 0;      // The Odometer from the start
let lastLocation: { latitude: number; longitude: number } | null = null // To remember the previous spot

/**
 * 3. THE START FUNCTION: This is what your "Start" button calls.
 * @param onUpdate: A function that lets us send data back to the UI.
 */


export const startRecording = async (onUpdate: (data: GhostPoint[]) => void) => {
    
    // RESETTING: We clear everything so a new run doesn't include the old run's data.
    pathData = [];
    totalDistance = 0;
    lastLocation = null;

    // PERMISSION CHECK: Ask the phone's operating system (iOS/Android) if we're allowed to use GPS. (Location from 'expo-location)
    const { status } = await Location.requestForegroundPermissionsAsync();

    // GUARD CLAUSE: If they say "No," stop right here and don't do anything else.
    if (status !== 'granted') return;

    // SUBSCRIPTION: We create a "Listener" that stays open.
    return await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.BestForNavigation,      // Use the highest power GPS mode
            distanceInterval: 5,                                // Trigger only after moving 5 meters
        },
        (location) => {
            // DATA EXTRACTION: Pull the current coordinates out of the GPS signal.
            const {latitude, longitude} = location.coords;

            // THE GAP CALCULATION: If this isn't the very first point...
            if (lastLocation) {
                // ...find the distance between where we were and where we are now.
                const gap = getDistance(lastLocation, {latitude, longitude});

                // ADD TO ODOMETER: Increase our total distance by that gap.
                totalDistance += gap;
            }

            // DATA PACKAGING: Create an object (The "GhostPoint") with all our info.
            const newPoint: GhostPoint = {
                latitude,
                longitude,
                timestamp: location.timestamp,
                distanceFromStart: totalDistance,
            };

            // SAVING: Add this new point to our growing list.
            pathData.push(newPoint);

            // UPDATING MEMORY: Set "lastLocation" to the current spot for the next calculation.
            lastLocation = { latitude, longitude };
            
            // UI NOTIFICATION: Use the spread operator `[...]` to send a fresh copy to the screen.
            onUpdate([...pathData]);
        }
    )
}
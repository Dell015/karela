import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export const PermissionManager = {
    requestLocation: async () => {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (foregroundStatus !== 'granted') {
            PermissionManager.showDeniedAlert(); 
            return false;
        }

        try {
            // Background is what keeps the "Ghost" running when the screen is OFF.
            // It is an ENHANCEMENT, not a requirement: foreground GPS is enough to
            // track a run. Returning false here made callers treat the whole
            // request as denied, so the START button silently did nothing.
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            if (backgroundStatus !== 'granted') {
                console.warn("Background location denied — ghost tracking limited to foreground.");
            }
            return true;
        } catch (e) {
            console.warn("Background location permission request failed:", e);
            return true; // Foreground is granted; tracking can still proceed.
        }
    },

    showDeniedAlert: () => {
        Alert.alert(
            "Location is off",
            "Karela needs your location to track runs. Turn on location for Karela in Settings.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
        );
    },

    checkLocationStatus: async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
    }
}
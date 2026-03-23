import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications'; // New import
import { Alert, Linking, Platform } from 'react-native';

export const PermissionManager = {
    requestLocation: async () => {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (foregroundStatus !== 'granted') {
            PermissionManager.showDeniedAlert(); 
            return false;
        }

        try {
            // Background is what keeps the "Ghost" running when the screen is OFF
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            return backgroundStatus === 'granted';
        } catch (e) {
            return true; 
        }
    },

    // NEW: Request for the Lock Screen Widget (Notifications)
    requestNotificationStats: async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            // Optional: You could show an alert here, but usually, users are 
            // okay if the widget doesn't show up, as long as the GPS works.
            console.warn("Notification permissions not granted for the widget.");
            return false;
        }
        return true;
    },

    showDeniedAlert: () => {
        Alert.alert(
            "Location Required",
            "Karela needs location access to track your runs. Please enable 'Allow all the time' in settings.",
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
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export const PermissionManager = {
    requestLocation: async () => {
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            
            if (foregroundStatus !== 'granted') {
                // Use the object name instead of 'this'
                PermissionManager.showDeniedAlert(); 
                return false;
            }

            try {
                const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
                return backgroundStatus === 'granted';
            } catch (e) {
                return true; 
            }
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
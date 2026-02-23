import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export const PermissionManager = {
    requestLocation: async () => {
        const {status} = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
        Alert.alert(
            "Location Required",
            "Karela needs location access to track your runs. Please enable it in settings.",
            [
                {text: "Cancel", style: "cancel"},
                {text: "Open Settings", onPress: () => Linking.openSettings()}
            ]
        );
        return false;
    }
    return true;

    },
    checkLocationStatus: async () => {
        const {status} = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
    }
}
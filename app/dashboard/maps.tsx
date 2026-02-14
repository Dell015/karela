import { loadRun, saveRun } from '@/services/tracker/StorageService';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { GhostPoint } from '../../services/tracker/GhostEngine';
import { startRecording } from '../../services/tracker/GhostRecorder';
import { ghostMapStyle } from '../../styles/ghostMapStyle';
import { styles } from '../../styles/mapStyles';

export default function MapsScreen() {
  // --- STATE MANAGEMENT ---
  const [location, setLocation] = useState<Location.LocationObject | null>(null); // Initial user location
  const [errorMsg, setErrorMsg] = useState<string | null>(null);                  // GPS error handling
  const [currentPath, setcurrentPath] = useState<GhostPoint[]>([]);               // Array of coordinates for the line
  const [isRecording, setIsRecording] = useState(false);                          // Toggle for UI buttons
  const [subscription, setSubscription] = useState<any>(null);                    // Holds the GPS watcher reference

  // --- DYNAMIC POINTER LOGIC ---
  // If we are recording, the "pointer" is the last item in our path array.
  // If not recording, it's just our initial GPS position.
  const latestPoint = currentPath.length > 0 
    ? { latitude: currentPath[currentPath.length - 1].latitude, longitude: currentPath[currentPath.length - 1].longitude }
    : location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null;

  // --- ACTION HANDLERS ---

  // Triggered when "Start Running" is pressed
  const handleStart = async () => {
    setIsRecording(true);
    setcurrentPath([]); // Reset path for a new run
    
    // Begin watching GPS. startRecording takes a callback that returns the updated path.
    const sub = await startRecording((newPath) => {
        setcurrentPath(newPath); // This updates the Polyline in real-time
    })
    setSubscription(sub); // Store so we can stop it later
  }

  // Triggered when "Stop Running" is pressed
  const handleStop = async () => {
    if (subscription) {
        subscription.remove(); // Kill the GPS watcher to save battery
        setSubscription(null);
    }

    setIsRecording(false);

    // Save the finished run to local storage
    if (currentPath.length > 0) {
        try {
            await saveRun(currentPath);
            alert("Run Saved!");
        } catch (error) {
            console.error("Save failed:", error);
        }
    }
  };

  // Helper to load the previous session's run from storage
  const handleLoad = async () => {
    const savedPoints = await loadRun();
    if (savedPoints.length > 0) {
        setcurrentPath(savedPoints);
        alert(`Loaded ${savedPoints.length} points from last run!`);
    } else {
        alert("No Saved runs found.");
    }
  }

  // --- INITIALIZATION ---
  useEffect(() => {
    (async () => {
      // 1. Request GPS permissions from the user
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // 2. Get a single fast "fix" on position to center the map on start
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  // --- RENDERING ---

  if (errorMsg) return <View style={styles.container}><Text>{errorMsg}</Text></View>;
  if (!location) return <View style={styles.container}><Text>Loading Map...</Text></View>;

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={ghostMapStyle} // Our custom Karela dark theme
        initialRegion={{
          // Center the map on the user's initial location
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        {/* THE TRAIL: Draws the green line based on path history */}
        <Polyline
            coordinates={currentPath}
            strokeColor='#7CF205' // Karela Neon Green
            strokeWidth={6}
        />

        {/* THE POINTER: Custom green dot showing current position */}
        {latestPoint && (
            <Marker coordinate={latestPoint} title='You'>
                <View style={{
                    backgroundColor: '#7CF205', 
                    padding: 10, 
                    borderRadius: 20, 
                    borderWidth: 3, 
                    borderColor: 'white'
                }} />
            </Marker>
        )}
      </MapView>

      {/* FLOATING ACTION BUTTON: Changes color and text based on state */}
      <TouchableOpacity
        style={[styles.floatingButtonContainer, isRecording ? styles.stopBtn : styles.startBtn]}
        onPress={isRecording ? handleStop : handleStart} 
      >
          <Text style={styles.buttonText}>
              {isRecording ? "Stop Running" : "Start Running"}
          </Text>
      </TouchableOpacity>
    </View>
  );
}
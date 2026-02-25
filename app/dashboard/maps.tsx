import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useLocationEngine } from "@/hooks/useLocationEngine";

/**
 * Mock data representing a previous run.
 * In a production app, this would be fetched from a database or local storage.
 */
export const MOCK_GHOST_DATA = [
  // --- SEGMENT 1: START & SPRINT (Running North) ---
  { latitude: 17.609076, longitude: 121.717660, timestamp: 0 },
  { latitude: 17.609500, longitude: 121.717620, timestamp: 2 },
  { latitude: 17.610000, longitude: 121.717580, timestamp: 4 },
  { latitude: 17.610500, longitude: 121.717500, timestamp: 6 },
  { latitude: 17.611000, longitude: 121.717450, timestamp: 8 },
  { latitude: 17.611305, longitude: 121.717407, timestamp: 10 }, // Arrived at first corner

  // --- SEGMENT 2: TIRED / RECOVERY WALK (Heading East) ---
  { latitude: 17.611320, longitude: 121.717700, timestamp: 16 }, // Big time jump = Walking
  { latitude: 17.611350, longitude: 121.718000, timestamp: 22 },
  { latitude: 17.611380, longitude: 121.718300, timestamp: 28 },
  { latitude: 17.611410, longitude: 121.718600, timestamp: 34 },
  { latitude: 17.611437, longitude: 121.718799, timestamp: 40 }, // Arrived at second corner

  // --- SEGMENT 3: STEADY FAST WALK (Heading South) ---
  { latitude: 17.611000, longitude: 121.718810, timestamp: 45 },
  { latitude: 17.610600, longitude: 121.718825, timestamp: 50 },
  { latitude: 17.610200, longitude: 121.718840, timestamp: 55 },
  { latitude: 17.609800, longitude: 121.718850, timestamp: 60 },
  { latitude: 17.609400, longitude: 121.718855, timestamp: 65 },
  { latitude: 17.609098, longitude: 121.718863, timestamp: 70 }, // Arrived at third corner

  // --- SEGMENT 4: STEADY JOG (Heading West) ---
  { latitude: 17.609080, longitude: 121.718600, timestamp: 74 },
  { latitude: 17.609070, longitude: 121.718400, timestamp: 78 },
  { latitude: 17.609060, longitude: 121.718200, timestamp: 82 },
  { latitude: 17.609050, longitude: 121.718000, timestamp: 86 },
  { latitude: 17.609035, longitude: 121.717800, timestamp: 90 },

  // --- SEGMENT 5: FINAL SPRINT FINISH ---
  { latitude: 17.609025, longitude: 121.717750, timestamp: 92 },
  { latitude: 17.609020, longitude: 121.717700, timestamp: 93 },
  { latitude: 17.609018, longitude: 121.717677, timestamp: 94 }, // FINISH!
];

/**
 * MapScreen Component
 * The primary user interface for the racing experience.
 * It visualizes the user's live path and the ghost runner's progress.
 */
export default function MapScreen() {
  /**
   * Destructure values from our custom logic hook.
   * This keeps the UI logic clean and separated from the GPS hardware logic.
   */
  const { 
    path, 
    ghostPosition, 
    isRacing, 
    setIsRacing, 
    currentLocation 
  } = useLocationEngine(MOCK_GHOST_DATA);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        /**
         * 'showsUserLocation' shows the native blue dot, 
         * but we are also drawing our own custom path/trail.
         */
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: 17.609,
          longitude: 121.715,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* RENDER USER TRAIL: A neon green line following the player */}
        {path.length > 0 && (
          <Polyline
            coordinates={path}
            strokeColor="#7CF205" // Karela Neon Green
            strokeWidth={6}
            lineDashPattern={[1]} // Makes the line look smoother on some devices
          />
        )}

        {/* RENDER GHOST: Visualized as a distinct marker only when data is available */}
        {ghostPosition && (
          <Marker 
            coordinate={ghostPosition} 
            title="The Ghost"
            description="Your past self"
          >
            {/* Custom visual for the ghost marker */}
            <View style={styles.ghostMarker} />
          </Marker>
        )}
      </MapView>

      {/* CONTROL UI: Floating button to toggle between Errand and Race modes */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsRacing(!isRacing)}
          style={[
            styles.actionButton,
            { backgroundColor: isRacing ? "#FF3B30" : "#7CF205" }
          ]}
        >
          <Text style={styles.buttonText}>
            {isRacing ? "STOP RACE" : "START RACE"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  ghostMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
});
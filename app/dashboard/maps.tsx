import { styles } from "@/styles/mapStyles";
import { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Define the focus point (San Francisco based on your coordinates)
const INITIAL_COORDS = { latitude: 17.609039, longitude: 121.715863 };

export default function MapScreen() {
  const router = useRouter();

  // 1. PLACEHOLDER PATH (Your Neon Trail)
  const [path, setPath] = useState([
    { latitude: 17.609039, longitude: 121.715863 },
    { latitude: 17.609067, longitude: 121.717644 },
    { latitude: 17.611286, longitude: 121.717423 },
  ]);

  // 2. GHOST PATH (The route to follow - offset for visibility)
  const [ghostPath] = useState([
    { latitude: 17.609039, longitude: 121.715863 },
    { latitude: 17.609067, longitude: 121.717644 },
    { latitude: 17.611286, longitude: 121.717423 },
    { latitude: 17.611452, longitude: 121.718797 },
  ]);

  const currentLocation = path[path.length - 1];
  const ghostPosition = ghostPath[3]; // Static placeholder for the ghost marker

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <MapView
        style={styles.map}
        initialRegion={{
          ...INITIAL_COORDS,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* THE GHOST ROUTE (Dashed guide) */}
        <Polyline
          coordinates={ghostPath}
          strokeColor="rgba(32, 159, 119, 0.4)"
          strokeWidth={3}
          lineDashPattern={[5, 5]}
        />

        {/* THE PLAYER TRAIL (Neon Path) */}
        <Polyline
          coordinates={path}
          strokeColor="rgba(124, 242, 5, 0.4)"
          strokeWidth={18}
          lineCap="round"
        />
        <Polyline
          coordinates={path}
          strokeColor="#7CF205"
          strokeWidth={6}
          lineCap="round"
        />

        {/* GHOST MARKER */}
        <Marker coordinate={ghostPosition} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.ghostMarker} />
        </Marker>

        {/* CURRENT PLAYER MARKER */}
        <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
          <View style={styles.marker} />
        </Marker>
      </MapView>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
}
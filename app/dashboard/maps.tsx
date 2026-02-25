import React, { useMemo, useRef } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocationEngine } from '@/hooks/useLocationEngine';
import { styles, MAP_CONFIG } from '@/styles/mapStyles';
import { Stack } from 'expo-router';
import { ghostMapStyle } from '@/styles/ghostMapStyle';

/**
 * Mock data representing a previous run.
 * In a production app, this would be fetched from a database or local storage.
 */
export const MOCK_GHOST_DATA = [
  // --- SEGMENT 1: START & INITIAL PUSH (0s - 40s) ---
  { latitude: 17.609076, longitude: 121.717660, timestamp: 0 },
  { latitude: 17.609300, longitude: 121.717650, timestamp: 10 },
  { latitude: 17.609600, longitude: 121.717630, timestamp: 20 },
  { latitude: 17.610000, longitude: 121.717600, timestamp: 30 },
  { latitude: 17.610500, longitude: 121.717550, timestamp: 40 },
  { latitude: 17.611305, longitude: 121.717407, timestamp: 50 }, // Corner 1

  // --- SEGMENT 2: STEADY JOG EAST (50s - 100s) ---
  { latitude: 17.611310, longitude: 121.717600, timestamp: 60 },
  { latitude: 17.611325, longitude: 121.717900, timestamp: 70 },
  { latitude: 17.611350, longitude: 121.718200, timestamp: 80 },
  { latitude: 17.611390, longitude: 121.718500, timestamp: 90 },
  { latitude: 17.611437, longitude: 121.718799, timestamp: 100 }, // Corner 2

  // --- SEGMENT 3: FATIGUE / SLOW WALK SOUTH (100s - 160s) ---
  // Note the high timestamp jumps for small distance changes
  { latitude: 17.611200, longitude: 121.718805, timestamp: 115 }, 
  { latitude: 17.610900, longitude: 121.718815, timestamp: 130 },
  { latitude: 17.610500, longitude: 121.718825, timestamp: 145 },
  { latitude: 17.610000, longitude: 121.718840, timestamp: 160 },

  // --- SEGMENT 4: RECOVERY & POWER WALK (160s - 210s) ---
  { latitude: 17.609600, longitude: 121.718850, timestamp: 175 },
  { latitude: 17.609300, longitude: 121.718860, timestamp: 190 },
  { latitude: 17.609098, longitude: 121.718863, timestamp: 205 }, // Corner 3

  // --- SEGMENT 5: FINAL TURN & STEADY PACE (205s - 230s) ---
  { latitude: 17.609080, longitude: 121.718400, timestamp: 215 },
  { latitude: 17.609060, longitude: 121.718000, timestamp: 225 },
  { latitude: 17.609045, longitude: 121.717850, timestamp: 230 },

  // --- SEGMENT 6: LAST SECOND SPRINT (230s - 240s) ---
  { latitude: 17.609030, longitude: 121.717750, timestamp: 235 },
  { latitude: 17.609020, longitude: 121.717700, timestamp: 238 },
  { latitude: 17.609018, longitude: 121.717677, timestamp: 240 }, // FINISH
];

/**
 * MapScreen Component
 * The primary user interface for the racing experience.
 * It visualizes the user's live path and the ghost runner's progress.
 */
export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { path, ghostPosition, isRacing, setIsRacing } = useLocationEngine(MOCK_GHOST_DATA);

  const targetPathLine = useMemo(() => 
    MOCK_GHOST_DATA.map(p => ({ latitude: p.latitude, longitude: p.longitude })), 
  []);

  // 1. Android Zoom Fix: Use animateCamera instead of just fitToCoordinates
  const fitToPath = () => {
    if (mapRef.current && targetPathLine.length > 0) {
      mapRef.current.animateCamera({
        center: targetPathLine[0],
        pitch: 0,
        heading: 0,
        zoom: 17.5, // High zoom level for a "running" feel
      }, { duration: 1000 });
    }
  };

  return (
    <View style={styles.container}>
      {/* Hide Header for full-screen immersion */}
      <Stack.Screen options={{ headerShown: false }} />

      <MapView
        ref={mapRef}
        style={styles.map}
        customMapStyle={ghostMapStyle }
        onMapReady={fitToPath}
        provider="google" // Force Google Maps for consistent behavior
        initialRegion={{
          latitude: 17.609076,
          longitude: 121.717660,
          latitudeDelta: 0.001, // Tighten these for Android
          longitudeDelta: 0.001,
        }}
        showsUserLocation={true}
        followsUserLocation={isRacing}
      >
        <Polyline
          coordinates={targetPathLine}
          strokeColor={MAP_CONFIG.futurePath.strokeColor}
          strokeWidth={MAP_CONFIG.futurePath.strokeWidth}
          lineDashPattern={Platform.OS === 'android' ? undefined : [0]}
          lineCap={Platform.OS === 'android' ? "butt" : "round"}
          lineJoin={Platform.OS === 'android' ? "miter" : "round"}
          geodesic={true}
        />

        {path.length > 1 && (
          <Polyline
            coordinates={path}
            strokeColor={MAP_CONFIG.traversedPath.strokeColor}
            strokeWidth={MAP_CONFIG.traversedPath.strokeWidth}
          />
        )}

        {isRacing && ghostPosition && (
          <Marker 
            coordinate={ghostPosition}
            // If Android, nudge the anchor to compensate for the rounding error.
            // If iOS, keep it at a perfect 0.5 center.
            anchor={
              Platform.OS === 'android' 
                ? { x: 0.4, y: 0.4 } // Nudge values: tweak these by 0.01 increments\
                : { x: 0.5, y: 0.5 }
            }
            tracksViewChanges={isRacing}
            flat={true}
          >
            <View style={styles.markerWrapper}>
              <View style={styles.ghostMarker} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* UI Elements */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="white" />
      </TouchableOpacity>

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
            {isRacing ? "STOP RACE" : "START CHALLENGE"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
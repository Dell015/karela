import React, { useMemo, useRef, useState, useEffect } from "react"; // Added useState & useEffect
import { View, TouchableOpacity, Text, Platform } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

// Hooks & Services
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { useQuestEngine } from "@/hooks/useQuestEngine";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { MAP_CONFIG, styles } from "@/styles/mapStyles";

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
  
  // 1. Hook States
  const { path, ghostPosition, isRacing, setIsRacing, currentLocation } =
    useLocationEngine(MOCK_GHOST_DATA);

  const { 
    checkpoints, questPath, questRewards, isDragging, 
    setIsDragging, addCheckpoint, deleteCheckpoint, moveCheckpoint 
  } = useQuestEngine();

  // 2. THE RESTORED FUNCTION
  const handleSpawnFlag = async () => {
    // We get the center of the current map view to drop the flag there
    const camera = await mapRef.current?.getCamera();
    if (camera?.center) {
      // We pass the center coordinates and current user location to the engine
      addCheckpoint(camera.center, currentLocation);
    }
  };

  const targetPathLine = useMemo(
    () => MOCK_GHOST_DATA.map((p) => ({ 
      latitude: p.latitude, 
      longitude: p.longitude 
    })),
    []
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <MapView
        ref={mapRef}
        style={styles.map}
        customMapStyle={ghostMapStyle}
        provider="google"
        showsUserLocation
        followsUserLocation={isRacing}
        // onLongPress removed to prevent accidental flag drops
      >
        {/* GHOST LINE - Forced Neon Green Transparent */}
        <Polyline
          key="ghost-line"
          coordinates={targetPathLine}
          strokeColor="#7CF20544" 
          strokeWidth={8}
        />

        {/* USER LIVE PATH - Forced Neon Green Solid */}
        {path.length > 1 && (
          <Polyline 
            key="user-path"
            coordinates={path} 
            strokeColor="#7CF205" 
            strokeWidth={8} 
          />
        )}

        {/* QUEST ROUTE - Forced Gold */}
        {questPath.length > 0 && (
          <Polyline 
            key="quest-route"
            coordinates={questPath} 
            strokeColor="#FFD700" 
            strokeWidth={6} 
          />
        )}

        {/* GHOST MARKER */}
        {ghostPosition && (
          <Marker coordinate={ghostPosition} anchor={{ x: 0.5, y: 0.5 }} flat>
            <View style={styles.markerWrapper}>
              <View style={styles.ghostMarker} />
            </View>
          </Marker>
        )}

        {/* QUEST FLAGS */}
        {checkpoints.map((point, index) => (
          <Marker
            key={point.id} // Stable ID stops duplication
            draggable
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude
            }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={async (e) => {
              setIsDragging(false);
              const dropped = e.nativeEvent.coordinate;
              
              const camera = await mapRef.current?.getCamera();
              if (camera) {
                // TRASH LOGIC: Center vs Drop Point
                const latDiff = camera.center.latitude - dropped.latitude;
                if (latDiff > 0.0015) { 
                  deleteCheckpoint(index, currentLocation);
                } else {
                  moveCheckpoint(index, dropped, currentLocation);
                }
              }
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View style={styles.checkpointLabel}>
                <Text style={styles.checkpointText}>{index + 1}</Text>
              </View>
              <Ionicons name="flag" size={36} color="#FFD700" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* REWARD HUD */}
      {questRewards && (
        <View style={styles.questCard}>
          <Text style={styles.rewardText}>💰 {questRewards.coins} | ✨ {questRewards.xp} XP</Text>
        </View>
      )}

      {/* TRASH UI - pointerEvents="none" ensures it doesn't block the drop */}
      {isDragging && (
        <View style={styles.trashBinContainer} pointerEvents="none">
          <View style={styles.trashBin}>
            <Ionicons name="trash" size={40} color="#FF3B30" />
            <Text style={styles.trashText}>DROP TO DELETE</Text>
          </View>
        </View>
      )}

      {/* INVENTORY BUBBLE - Calls handleSpawnFlag */}
      <TouchableOpacity style={styles.flagSpawner} onPress={handleSpawnFlag}>
        {checkpoints.length > 0 && (
          <View style={styles.flagCountBadge}>
            <Text style={{color:'white', fontSize:10, fontWeight:'bold'}}>{checkpoints.length}</Text>
          </View>
        )}
        <Ionicons name="flag" size={24} color="#FFD700" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="white" />
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isRacing ? "#FF3B30" : "#7CF205" }]}
          onPress={() => setIsRacing(!isRacing)}
        >
          <Text style={styles.buttonText}>{isRacing ? "STOP" : "START"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, TouchableOpacity, Text, Platform, ActivityIndicator } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

// Hooks & Services
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { useQuestEngine } from "@/hooks/useQuestEngine";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { MAP_CONFIG, styles } from "@/styles/mapStyles";

export const MOCK_GHOST_DATA = [
  { latitude: 17.609076, longitude: 121.717660, timestamp: 0 },
  { latitude: 17.609300, longitude: 121.717650, timestamp: 10 },
  { latitude: 17.609600, longitude: 121.717630, timestamp: 20 },
  { latitude: 17.610000, longitude: 121.717600, timestamp: 30 },
  { latitude: 17.610500, longitude: 121.717550, timestamp: 40 },
  { latitude: 17.611305, longitude: 121.717407, timestamp: 50 },
  { latitude: 17.611310, longitude: 121.717600, timestamp: 60 },
  { latitude: 17.611325, longitude: 121.717900, timestamp: 70 },
  { latitude: 17.611350, longitude: 121.718200, timestamp: 80 },
  { latitude: 17.611390, longitude: 121.718500, timestamp: 90 },
  { latitude: 17.611437, longitude: 121.718799, timestamp: 100 },
  { latitude: 17.611200, longitude: 121.718805, timestamp: 115 },
  { latitude: 17.610900, longitude: 121.718815, timestamp: 130 },
  { latitude: 17.610500, longitude: 121.718825, timestamp: 145 },
  { latitude: 17.611000, longitude: 121.718840, timestamp: 160 },
  { latitude: 17.609600, longitude: 121.718850, timestamp: 175 },
  { latitude: 17.609300, longitude: 121.718860, timestamp: 190 },
  { latitude: 17.609098, longitude: 121.718863, timestamp: 205 },
  { latitude: 17.609080, longitude: 121.718400, timestamp: 215 },
  { latitude: 17.609060, longitude: 121.718000, timestamp: 225 },
  { latitude: 17.609045, longitude: 121.717850, timestamp: 230 },
  { latitude: 17.609030, longitude: 121.717750, timestamp: 235 },
  { latitude: 17.609020, longitude: 121.717700, timestamp: 238 },
  { latitude: 17.609018, longitude: 121.717677, timestamp: 240 },
];

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [hasZoomed, setHasZoomed] = useState(false);
  
  const { path, ghostPosition, isRacing, setIsRacing, currentLocation } =
    useLocationEngine(MOCK_GHOST_DATA);

  const { 
    checkpoints, questPath, questRewards, isDragging, 
    setIsDragging, addCheckpoint, deleteCheckpoint, moveCheckpoint 
  } = useQuestEngine();

  // 1. ZOOM EFFECT: Wide -> Tight
  useEffect(() => {
    if (currentLocation && !hasZoomed && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005, // Street level
          longitudeDelta: 0.005,
        }, 2500); // Cinematic duration
        
        setHasZoomed(true);
      }, 500);
    }
  }, [currentLocation, hasZoomed]);

  const handleSpawnFlag = async () => {
    const camera = await mapRef.current?.getCamera();
    if (camera?.center) {
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

  // 2. CRASH PREVENTION: Wait for GPS signal before rendering Map
  if (!currentLocation) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' }]}>
        <ActivityIndicator size="large" color="#7CF205" />
        <Text style={{ color: 'white', marginTop: 10 }}>Locating in Philippines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <MapView
        ref={mapRef}
        style={styles.map}
        customMapStyle={ghostMapStyle}
        provider="google"
        showsUserLocation={true}
        followsUserLocation={isRacing}
        // Starts with a wider view, but already centered on your PH location
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05, 
          longitudeDelta: 0.05,
        }}
      >
        <Polyline
          key="ghost-line"
          coordinates={targetPathLine}
          strokeColor="#7CF20544" 
          strokeWidth={8}
        />

        {path.length > 1 && (
          <Polyline 
            key="user-path"
            coordinates={path} 
            strokeColor="#7CF205" 
            strokeWidth={8} 
          />
        )}

        {questPath.length > 0 && (
          <Polyline 
            key="quest-route"
            coordinates={questPath} 
            strokeColor="#FFD700" 
            strokeWidth={6} 
          />
        )}

        {ghostPosition && (
          <Marker coordinate={ghostPosition} anchor={{ x: 0.5, y: 0.5 }} flat>
            <View style={styles.markerWrapper}>
              <View style={styles.ghostMarker} />
            </View>
          </Marker>
        )}

        {checkpoints.map((point, index) => (
          <Marker
            key={point.id}
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

      {questRewards && (
        <View style={styles.questCard}>
          <Text style={styles.rewardText}>💰 {questRewards.coins} | ✨ {questRewards.xp} XP</Text>
        </View>
      )}

      {isDragging && (
        <View style={styles.trashBinContainer} pointerEvents="none">
          <View style={styles.trashBin}>
            <Ionicons name="trash" size={40} color="#FF3B30" />
            <Text style={styles.trashText}>DROP TO DELETE</Text>
          </View>
        </View>
      )}

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
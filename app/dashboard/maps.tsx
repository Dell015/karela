// app/dashboard/maps.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

// Hooks & Services
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { useQuestEngine } from "@/hooks/useQuestEngine";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { MAP_CONFIG, styles } from "@/styles/mapStyles";

/**
 * MOCK_GHOST_DATA
 * Represents a pre-recorded run path for the 'Ghost' racer.
 */
export const MOCK_GHOST_DATA = [
  { latitude: 17.609076, longitude: 121.71766, timestamp: 0 },
  { latitude: 17.6093, longitude: 121.71765, timestamp: 10 },
  { latitude: 17.6096, longitude: 121.71763, timestamp: 20 },
  { latitude: 17.61, longitude: 121.7176, timestamp: 30 },
  { latitude: 17.6105, longitude: 121.71755, timestamp: 40 },
  { latitude: 17.611305, longitude: 121.717407, timestamp: 50 },
  { latitude: 17.61131, longitude: 121.7176, timestamp: 60 },
  { latitude: 17.611325, longitude: 121.7179, timestamp: 70 },
  { latitude: 17.61135, longitude: 121.7182, timestamp: 80 },
  { latitude: 17.61139, longitude: 121.7185, timestamp: 90 },
  { latitude: 17.611437, longitude: 121.718799, timestamp: 100 },
  { latitude: 17.6112, longitude: 121.718805, timestamp: 115 },
  { latitude: 17.6109, longitude: 121.718815, timestamp: 130 },
  { latitude: 17.6105, longitude: 121.718825, timestamp: 145 },
  { latitude: 17.611, longitude: 121.71884, timestamp: 160 },
  { latitude: 17.6096, longitude: 121.71885, timestamp: 175 },
  { latitude: 17.6093, longitude: 121.71886, timestamp: 190 },
  { latitude: 17.609098, longitude: 121.718863, timestamp: 205 },
  { latitude: 17.60908, longitude: 121.7184, timestamp: 215 },
  { latitude: 17.60906, longitude: 121.718, timestamp: 225 },
  { latitude: 17.609045, longitude: 121.71785, timestamp: 230 },
  { latitude: 17.60903, longitude: 121.71775, timestamp: 235 },
  { latitude: 17.60902, longitude: 121.7177, timestamp: 238 },
  { latitude: 17.609018, longitude: 121.717677, timestamp: 240 },
];

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [hasZoomed, setHasZoomed] = useState(false);
  const isProcessing = useRef(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // --- HOOKS ---
  const {
    path,
    ghostPosition,
    isRacing,
    setIsRacing,
    currentLocation,
    currentSpeed,
    compassHeading,
  } = useLocationEngine(MOCK_GHOST_DATA);

  const {
    checkpoints,
    questPath,
    questRewards,
    isDragging,
    isOverTrash,
    totalDistance,
    setIsDragging,
    setIsOverTrash,
    addCheckpoint,
    deleteCheckpoint,
    moveCheckpoint,
    changeCameraHeading,
    updateRemainingPath,
  } = useQuestEngine(mapRef);

  // Timer Logic: Starts when isRacing is true
  useEffect(() => {
    let interval: any;
    if (isRacing) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      // Optional: Reset timer to 0 when stopping
      // setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isRacing]);

  // Formatter: Converts seconds to 00:00 or 0:00:00
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };
  // --- PATH EATING LOGIC ---
  useEffect(() => {
    if (isRacing && currentLocation) {
      // This is the missing link that makes the gold line disappear as you move
      updateRemainingPath(currentLocation); 
    }
  }, [currentLocation, isRacing]);
  
  // --- CAMERA LOGIC (FIXED: Moved out of return) ---
  useEffect(() => {
    if (isRacing && currentLocation && mapRef.current) {
      if (isProcessing.current) return;
      isProcessing.current = true;

      mapRef.current.animateCamera(
        {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          heading: compassHeading,
          pitch: 55,
          zoom: 20,
        },
        { duration: 1500 },
      );

      setTimeout(() => {
        isProcessing.current = false;
      }, 800);
    }
  }, [currentLocation, compassHeading, isRacing]);

  // --- INITIAL ZOOM ---
  useEffect(() => {
    if (currentLocation && !hasZoomed && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          2500,
        );
        setHasZoomed(true);
      }, 500);
    }
  }, [currentLocation, hasZoomed]);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return ` ${Math.round(meters)} M`;
    return ` ${(meters / 1000).toFixed(2)} KM`;
  };

  const handleSpawnFlag = async () => {
    const camera = await mapRef.current?.getCamera();
    if (camera?.center) {
      addCheckpoint(camera.center, currentLocation);
    }
  };

  const targetPathLine = useMemo(
    () =>
      MOCK_GHOST_DATA.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
      })),
    [],
  );

  if (!currentLocation) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#1A1A1A",
          },
        ]}
      >
        <ActivityIndicator size="large" color="#7CF205" />
        <Text style={{ color: "white", marginTop: 10 }}>
          Locating in Philippines...
        </Text>
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
        followsUserLocation={false}
        rotateEnabled={true}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* GHOST LINE */}
        {targetPathLine.length > 1 && (
          <Polyline coordinates={targetPathLine} {...MAP_CONFIG.futurePath} />
        )}

        {/* QUEST ROUTE */}
        {questPath.length > 1 && (
          <Polyline
            coordinates={[currentLocation, ...questPath.slice(1)]}
            {...MAP_CONFIG.questPath}
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

        {/* FLAGS */}
        {checkpoints.map((point, index) => (
          <Marker
            key={point.id}
            draggable={!isRacing}
            coordinate={point}
            onDragStart={() => setIsDragging(true)}
            onDrag={async (e) => {
              const draggedCoord = e.nativeEvent.coordinate;
              const camera = await mapRef.current?.getCamera();
              if (
                camera &&
                camera.center.latitude - draggedCoord.latitude > 0.0015
              ) {
                if (!isOverTrash) setIsOverTrash(true);
              } else {
                if (isOverTrash) setIsOverTrash(false);
              }
            }}
            onDragEnd={async (e) => {
              setIsDragging(false);
              setIsOverTrash(false);
              const dropped = e.nativeEvent.coordinate;
              const camera = await mapRef.current?.getCamera();
              if (
                camera &&
                camera.center.latitude - dropped.latitude > 0.0015
              ) {
                deleteCheckpoint(index, currentLocation);
              } else {
                moveCheckpoint(index, dropped, currentLocation);
              }
            }}
          >
            <View style={{ alignItems: "center" }}>
              <View style={styles.checkpointLabel}>
                <Text style={styles.checkpointText}>{index + 1}</Text>
              </View>
              <Ionicons
                name="flag"
                size={36}
                color={(point as any).isReached ? "#7CF205" : "#FFD700"}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* --- 1. LIVE HUD: Visible only when Racing --- */}
      {isRacing && (
        <View style={styles.hudOverlay}>
          {/* 1. TIME */}
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>TIME</Text>
            <Text style={styles.hudValue}>{formatTime(elapsedTime)}</Text>
          </View>
          <View style={styles.hudDivider} />

          {/* 2. SPEED */}
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>KM/H</Text>
            <Text style={[styles.hudValue, (currentSpeed ?? 0) > 35 && { color: '#FF3B30' }]}>
              {currentSpeed ?? 0}
            </Text>
          </View>
          <View style={styles.hudDivider} />

          {/* 3. DISTANCE */}
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>DIST</Text>
            <Text style={styles.hudValue}>{formatDistance(totalDistance)}</Text>
          </View>
          <View style={styles.hudDivider} />

          {/* 4. CALORIES */}
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>KCAL</Text>
            <Text style={styles.hudValue}>{Math.round(totalDistance * 0.06)}</Text>
          </View>
          <View style={styles.hudDivider} />

          {/* 5. GOAL */}
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>GOAL</Text>
            <Text style={styles.hudValue}>
              {checkpoints.filter(f => (f as any).isReached).length}/{checkpoints.length}
            </Text>
          </View>
        </View>
    )}

      {/* --- 3. EDITOR TOOLS: Hidden when Racing --- */}
      {!isRacing && (
        <>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cameraAngle}
            onPress={() => changeCameraHeading("N")}
          >
            <Ionicons name="compass" size={24} color="#FFD700" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.flagSpawner}
            onPress={handleSpawnFlag}
          >
            {checkpoints.length > 0 && (
              <View style={styles.flagCountBadge}>
                <Text
                  style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
                >
                  {checkpoints.length}
                </Text>
              </View>
            )}
            <Ionicons name="flag" size={24} color="#FFD700" />
          </TouchableOpacity>

          {questRewards && (
            <View style={styles.questCard}>
              <Text style={styles.rewardText}>
                {questRewards.coins} Pts | {questRewards.xp} XP |{" "}
                {formatDistance(totalDistance)}
              </Text>
            </View>
          )}
        </>
      )}

      {/* TRASH BIN: Active during dragging */}
      {isDragging && (
        <View
          style={[
            styles.trashBinContainer,
            { opacity: isOverTrash ? 0.35 : 1.0 },
          ]}
          pointerEvents="none"
        >
          <View style={styles.trashBin}>
            <Ionicons name="trash" size={40} color="#FF3B30" />
            <Text style={styles.trashText}>DROP TO DELETE</Text>
          </View>
        </View>
      )}

      {/* --- 4. START/STOP TOGGLE --- */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isRacing ? "#FF3B30" : "#7CF205" },
          ]}
          onPress={() => setIsRacing(!isRacing)}
        >
          <Text style={styles.buttonText}>{isRacing ? "STOP" : "START"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

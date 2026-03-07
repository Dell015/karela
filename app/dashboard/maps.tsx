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
 * In a production environment, this would be fetched from the SQLite database.
 */
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
  const isProcessing = useRef(false);

  /**
   * useLocationEngine
   * Manages the live GPS tracking and ghost positioning during a race.
   */
  const { path, ghostPosition, isRacing, setIsRacing, currentLocation, currentSpeed, compassHeading} =
    useLocationEngine(MOCK_GHOST_DATA);

  /**
   * useQuestEngine
   * Manages the placement, movement, and deletion of checkpoints.
   * Now includes 'isOverTrash' for real-time hover feedback.
   */
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

  /**
   * formatDistance
   * Converts raw meters into a human-readable string (M or KM).
   */
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return ` ${Math.round(meters)} M`;
    }
    return ` ${(meters / 1000).toFixed(2)} KM`;
  };

  /**
   * PH SPEED LIMIT LOGIC
   * If speed > 35km/h, the UI warns the user they are moving too fast for a "run".
   */
  const isSpeeding = (currentSpeed ?? 0) > 35;

  /**
   * ZOOM EFFECT
   * Triggers once GPS is acquired to transition from a wide regional view
   * to a tight street-level view centered on the user.
   */
  useEffect(() => {
    if (currentLocation && !hasZoomed && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 2500);
        setHasZoomed(true);
      }, 500);
    }
  }, [currentLocation, hasZoomed]);

  useEffect(() => {
    if (isRacing && currentLocation && mapRef.current) {
      // 1. "Gimbal Lock": If we are already animating, don't interrupt.
      // This stops the 'stutter' caused by overlapping commands.
      if (isProcessing.current) return;

      isProcessing.current = true;

      mapRef.current.animateCamera({
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        heading: compassHeading,
        // Google uses a lower pitch (roughly 45-55) for better horizon visibility
        pitch: 55, 
        // Zoom 18 is the sweet spot for "Street View" navigation
        zoom: 50,
      }, { duration: 1500 }); // LONG duration creates the smooth "drift" feel

      // Unlock after a delay to allow the animation to breathe
      setTimeout(() => {
        isProcessing.current = false;
      }, 800); 
    }
  }, [currentLocation, compassHeading, isRacing]);

  /**
   * handleSpawnFlag
   * Places a checkpoint marker at the current center of the map view.
   */
  const handleSpawnFlag = async () => {
    const camera = await mapRef.current?.getCamera();
    if (camera?.center) {
      addCheckpoint(camera.center, currentLocation);
    }
  };

  /**
   * targetPathLine
   * Memoized coordinates for the static Ghost path display.
   */
  const targetPathLine = useMemo(
    () => MOCK_GHOST_DATA.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
    })),
    []
  );

  /**
   * LOADING STATE
   * Prevents map rendering until a valid GPS signal is found.
   */
  if (!currentLocation) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", backgroundColor: "#1A1A1A" }]}>
        <ActivityIndicator size="large" color="#7CF205" />
        <Text style={{ color: "white", marginTop: 10 }}>Locating in Philippines...</Text>
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
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* GHOST LINE: Visualizing the target route */}
        {targetPathLine.length > 1 && (
          <Polyline
            key={`ghost-${targetPathLine.length}`}
            coordinates={targetPathLine}
            {...MAP_CONFIG.futurePath}
            lineJoin="round"
            lineCap="round"
          />
        )}

        {/* USER LIVE PATH: Visualizing where the user has traveled */}
        {path.length > 1 && (
          <Polyline
            key={`user-${path.length}`}
            coordinates={path}
            {...MAP_CONFIG.traversedPath}
            lineJoin="round"
            lineCap="round"
          />
        )}

        {/* QUEST ROUTE */}
        {questPath.length > 1 && currentLocation && (
          <Polyline
            key={`quest-path-${questPath.length}`}
            // We spread the currentPath BUT override index 0 with the live GPS 
            // This creates a "rubber band" effect if you go off-road
            coordinates={[currentLocation, ...questPath.slice(1)]} 
            {...MAP_CONFIG.questPath}
            geodesic={true}
            lineJoin="round"
            lineCap="round"
          />
        )}

        {/* GHOST POSITION MARKER */}
        {ghostPosition && (
          <Marker coordinate={ghostPosition} anchor={{ x: 0.5, y: 0.5 }} flat>
            <View style={styles.markerWrapper}>
              <View style={styles.ghostMarker} />
            </View>
          </Marker>
        )}

        {/* QUEST CHECKPOINT MARKERS */}
        {checkpoints.map((point, index) => (
          <Marker
            key={point.id}
            draggable
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            onDragStart={() => setIsDragging(true)}
            /**
             * onDrag Logic:
             * Continuously calculates if the dragged marker is within the 'trash zone'.
             * Updates 'isOverTrash' for real-time opacity changes.
             */
            onDrag={async (e) => {
              // 1. Capture the coordinate immediately (Synchronous)
              const draggedCoord = e.nativeEvent.coordinate;

              // 2. Now you can safely await the camera
              const camera = await mapRef.current?.getCamera();
              
              if (camera && draggedCoord) {
                const latDiff = camera.center.latitude - draggedCoord.latitude;
                if (latDiff > 0.0015) {
                  if (!isOverTrash) setIsOverTrash(true);
                } else {
                  if (isOverTrash) setIsOverTrash(false);
                }
              }
            }}
            /**
             * onDragEnd Logic:
             * Finalizes the marker move or deletes it if released in the trash zone.
             */
            onDragEnd={async (e) => {
              setIsDragging(false);
              setIsOverTrash(false);
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
            <View style={{ alignItems: "center" }}>
              <View style={styles.checkpointLabel}>
                <Text style={styles.checkpointText}>{index + 1}</Text>
              </View>
              <Ionicons name="flag" size={36} color="#FFD700" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* REWARD & DISTANCE CARD */}
      {questRewards && (
        <View style={styles.questCard}>
          <Text style={styles.rewardText}>
            {questRewards.coins} Points | {questRewards.xp} XP | {formatDistance(totalDistance)}
          </Text>
        </View>
      )}

      {/* TRASH BIN OVERLAY: Appears only when dragging a marker */}
      {isDragging && (
        <View 
          style={[styles.trashBinContainer, { opacity: isOverTrash ? 0.35 : 1.0 }]} 
          pointerEvents="none"
        >
          <View style={styles.trashBin}>
            <Ionicons name="trash" size={40} color="#FF3B30" />
            <Text style={styles.trashText}>DROP TO DELETE</Text>
          </View>
        </View>
      )}

      {/* CAMERA RESET BUTTON: Sets view to North */}
      <TouchableOpacity style={styles.cameraAngle} onPress={() => changeCameraHeading("N")}>
        <Ionicons name="compass" size={24} color="#FFD700" />
      </TouchableOpacity>

      {/* FLAG SPAWNER BUTTON */}
      <TouchableOpacity style={styles.flagSpawner} onPress={handleSpawnFlag}>
        {checkpoints.length > 0 && (
          <View style={styles.flagCountBadge}>
            <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>{checkpoints.length}</Text>
          </View>
        )}
        <Ionicons name="flag" size={24} color="#FFD700" />
      </TouchableOpacity>

      {/* NAVIGATION: Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="white" />
      </TouchableOpacity>

      {/* SPEEDOMETER */}
      <View style={[
        styles.speedometerContainer, 
        (currentSpeed ?? 0) > 35 && { borderColor: '#FF3B30' } 
      ]}>
        <Text style={[
          styles.speedValue, 
          (currentSpeed ?? 0) > 35 && { color: '#FF3B30' }
        ]}>
          {currentSpeed ?? 0}
        </Text>
        <Text style={[
          styles.speedUnit, 
          (currentSpeed ?? 0) > 35 && { color: '#FF3B30' }
        ]}>KM/H</Text>
      </View>

      {/* RACE CONTROLS: Start/Stop Toggle */}
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
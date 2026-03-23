import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker, Polyline } from "react-native-maps";

// Hooks & Services
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { useQuestEngine } from "@/hooks/useQuestEngine";
import { getLatestGhostRun } from "@/services/database/database";
import { PermissionManager } from "@/services/PermissionsManager";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { styles } from "@/styles/mapStyles";

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [hasZoomed, setHasZoomed] = useState(false);
  const isProcessing = useRef(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [physicalMeters, setPhysicalMeters] = useState(0);

  // --- GHOST STATE ---
  const [isGhostEnabled, setIsGhostEnabled] = useState(false);
  const [activeGhostData, setActiveGhostData] = useState<any[]>([]);

  // --- HOOKS ---
  const {
    path,
    ghostPosition,
    isRacing,
    currentLocation,
    currentSpeed,
    compassHeading,
    setIsRacing,
    setPath,
  } = useLocationEngine(activeGhostData);

  const {
    checkpoints,
    questPath,
    addCheckpoint,
    deleteCheckpoint,
    moveCheckpoint,
    changeCameraHeading,
    updateRemainingPath,
  } = useQuestEngine(mapRef);

  // --- PHYSICAL DISTANCE TRACKER (Haversine Logic) ---
  useEffect(() => {
    if (isRacing && path.length > 1) {
      const lastPoint = path[path.length - 1];
      const prevPoint = path[path.length - 2];

      const R = 6371000; // Earth's radius in meters
      const dLat = ((lastPoint.latitude - prevPoint.latitude) * Math.PI) / 180;
      const dLon =
        ((lastPoint.longitude - prevPoint.longitude) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((prevPoint.latitude * Math.PI) / 180) *
          Math.cos((lastPoint.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMoved = R * c;

      // Anti-Cheat & Drift Filter
      if (!lastPoint.isVehicle && distanceMoved > 1.5 && distanceMoved < 40) {
        setPhysicalMeters((prev) => prev + distanceMoved);
      }
    }
  }, [path, isRacing]);

  // --- SYNC ENGINE (Path Eating & Flag Popping) ---
  useEffect(() => {
    if (isRacing && currentLocation) {
      updateRemainingPath(currentLocation);
    }
  }, [currentLocation, isRacing]);

  // --- RACE CONTROLS ---
  const handleStartRace = async () => {
    const locationAllowed = await PermissionManager.requestLocation();
    if (locationAllowed) {
      // 1. Reset all local screen states
      setPhysicalMeters(0);
      setElapsedTime(0);
      setPath([]); // Force clear the trail array before starting
      
      // 2. Trigger the engine
      setIsRacing(true);
    }
  };

  const handleStopRace = () => {
    setIsRacing(false);
    router.push({
      pathname: "/dashboard/summary",
      params: {
        meters: Math.floor(physicalMeters),
        seconds: elapsedTime,
        kcal: (physicalMeters * 0.062).toFixed(1),
        xp: Math.floor(physicalMeters * 0.1),
        path: JSON.stringify(path),
      },
    });
  };

  // --- GHOST LOGIC ---
  const toggleGhost = () => {
    if (!isGhostEnabled) {
      const savedData = getLatestGhostRun();
      if (savedData) {
        setActiveGhostData(savedData);
        setIsGhostEnabled(true);
      } else {
        Alert.alert(
          "No Ghost Found",
          "Save a run first to race against yourself!",
        );
      }
    } else {
      setIsGhostEnabled(false);
      setActiveGhostData([]);
    }
  };

  const handleSpawnFlag = async () => {
    const camera = await mapRef.current?.getCamera();
    if (camera?.center) {
      addCheckpoint(camera.center, currentLocation);
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isRacing) {
      interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRacing]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- CAMERA AUTO-FOLLOW ---
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

  // Initial Zoom
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
        provider="google"
        googleRenderer="LATEST"
        customMapStyle={ghostMapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false} // Prevents Google from overriding UI
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* --- GHOST ENGINE LAYER --- */}
        {/* GHOST LINE (The static path of the saved run) */}
        {isGhostEnabled && activeGhostData.length > 1 && (
          <Polyline
            coordinates={activeGhostData}
            strokeColor="rgba(255, 215, 0, 0.4)"
            strokeColors={["rgba(255, 215, 0, 0.4)"]} // Override native blue
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            zIndex={1000}
            lineDashPattern={[5, 10]}
            geodesic={true}
          />
        )}

        {/* GHOST MARKER (The actual moving ghost) */}
        {isGhostEnabled && ghostPosition && (
          <Marker
            coordinate={ghostPosition}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            zIndex={9000} // Keep it high so it stays above your own trail
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#FFD700",
                borderWidth: 3,
                borderColor: "white",
                elevation: 5, // Fix for Android clipping
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 3,
              }}
            />
          </Marker>
        )}

        {/* QUEST ROUTE (Gold Line) - FIXED TO PREVENT BLUE */}
        {questPath.length > 1 && (
          <Polyline
            coordinates={[currentLocation, ...questPath.slice(1)]}
            strokeColor="#FFD700"
            strokeColors={["#FFD700"]} // Force plural to override native blue
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
            zIndex={2000} // High Z-Index to stay above user path
            geodesic={true}
          />
        )}

        {/* USER TRAIL (Heatmap: Green = Run, Red = Vehicle) */}
        {path.map((point, index) => {
          if (index === 0 || !path[index - 1]) return null;
          const prevPoint = path[index - 1];

          // We define the color here
          const segmentColor = point.isVehicle ? "#FF3B30" : "#7CF205";

          return (
            <Polyline
              key={`trail_${index}`}
              coordinates={[prevPoint, point]}
              // FIX: We provide both singular and plural to override the native driver
              strokeColor={segmentColor}
              strokeColors={[segmentColor, segmentColor]}
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
              // Extremely high Z-Index to stay on top of any hidden Google layers
              zIndex={5000 + index}
              geodesic={true}
            />
          );
        })}

        {/* FLAGS (Checkpoints) */}
        {checkpoints.map((point, index) => {
          if ((point as any).isReached) return null;

          return (
            <Marker
              key={point.id}
              draggable={!isRacing}
              coordinate={point}
              onDragEnd={async (e) => {
                const dropped = e.nativeEvent.coordinate;
                moveCheckpoint(index, dropped, currentLocation);
              }}
            >
              <View style={{ alignItems: "center" }}>
                <View style={styles.checkpointLabel}>
                  <Text style={styles.checkpointText}>{index + 1}</Text>
                </View>
                <Ionicons name="flag" size={36} color="#FFD700" />
              </View>

              <Callout
                tooltip
                onPress={() => {
                  Alert.alert(
                    "Manage Checkpoint",
                    "What would you like to do?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete Flag",
                        onPress: () => deleteCheckpoint(index, currentLocation),
                        style: "destructive",
                      },
                    ],
                  );
                }}
              >
                <View style={styles.calloutBubble}>
                  <Text style={styles.calloutText}>Tap to Delete</Text>
                  <Ionicons name="trash-outline" size={20} color="white" />
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* HUD */}
      {isRacing && (
        <View style={styles.hudOverlay}>
          <div style={styles.hudStat}>
            <Text style={styles.hudLabel}>TIME</Text>
            <Text style={styles.hudValue}>{formatTime(elapsedTime)}</Text>
          </div>
          <View style={styles.hudDivider} />
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>KM/H</Text>
            <Text
              style={[
                styles.hudValue,
                (currentSpeed ?? 0) > 35 && { color: "#FF3B30" },
              ]}
            >
              {currentSpeed ?? 0}
            </Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>METERS</Text>
            <Text style={styles.hudValue}>{Math.floor(physicalMeters)}</Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>GOAL</Text>
            <Text style={styles.hudValue}>
              {checkpoints.filter((f) => (f as any).isReached).length}/
              {checkpoints.length}
            </Text>
          </View>
        </View>
      )}

      {/* TOOLS (Only visible when NOT racing) */}
      {!isRacing && (
        <>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rightButtonBase, styles.compassButton]}
            onPress={() => changeCameraHeading("N")}
          >
            <Ionicons name="compass" size={24} color="#FFD700" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rightButtonBase,
              styles.ghostButton,
              {
                backgroundColor: isGhostEnabled
                  ? "#7CF205"
                  : "rgba(0,0,0,0.85)",
              },
            ]}
            onPress={toggleGhost}
          >
            <Ionicons
              name="flash"
              size={24}
              color={isGhostEnabled ? "black" : "#FFD700"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rightButtonBase, styles.flagSpawner]}
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
        </>
      )}

      {/* ACTION BUTTON */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isRacing ? "#FF3B30" : "#7CF205" },
          ]}
          onPress={() => (isRacing ? handleStopRace() : handleStartRace())}
        >
          <Text style={styles.buttonText}>{isRacing ? "STOP" : "START"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

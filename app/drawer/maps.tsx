import { KARELA } from "@/styles/designSystem";
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
import { CivicHUD } from "@/components/CivicHUD";
import { useAuth } from "@/context/AuthContext";
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { useRouteBuilder } from "@/hooks/useRouteBuilder";
import { getLatestGhostRun } from "@/services/database/sqlite/database";
import {
  CivicCategory,
  CivicNode,
  getNearbyNodes,
  reconfirmNode,
  submitCivicReport,
  uploadCivicPhoto
} from "@/services/engines/CivicEngine";
import { getGhost } from "@/services/engines/GhostModelManager";
import {
  getResonanceState,
  ResonanceState,
  RunContext,
} from "@/services/engines/ResonanceSystem";
import { PermissionManager } from "@/services/PermissionsManager";
import { calculateStreak } from "@/services/statsService";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { styles } from "@/styles/mapStyles";

export default function MapScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [hasZoomed, setHasZoomed] = useState(false);
  const isProcessing = useRef(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [physicalMeters, setPhysicalMeters] = useState(0);
  const [is3DMode, setIs3DMode] = useState(false);
  const lastInteractionTime = useRef<number>(0);
  const SNAP_BACK_DELAY = 15000; // 15 seconds in milliseconds

  // --- GHOST STATE ---
  const [isGhostEnabled, setIsGhostEnabled] = useState(false);
  const [activeGhostData, setActiveGhostData] = useState<any[]>([]);

  // --- CIVIC STATE ---
  const [nearbyNodes, setNearbyNodes] = useState<CivicNode[]>([]);
  const [resonance, setResonance] = useState<ResonanceState | null>(null);

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

  const handleRegionChangeComplete = async () => {
    const camera = await mapRef.current?.getCamera();
    // Usually, a pitch > 10-20 degrees is considered "3D"
    if (camera && camera.pitch > 10) {
      setIs3DMode(true);
    } else {
      setIs3DMode(false);
    }
  };

  const {
    checkpoints,
    questPath,
    addCheckpoint,
    deleteCheckpoint,
    moveCheckpoint,
    changeCameraHeading,
    updateRemainingPath,
  } = useRouteBuilder(mapRef);

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

      if (!lastPoint.isVehicle && distanceMoved > 1.5 && distanceMoved < 40) {
        setPhysicalMeters((prev) => prev + distanceMoved);
      }
    }
  }, [path, isRacing]);

  // --- SYNC ENGINE ---
  useEffect(() => {
    if (isRacing && currentLocation) {
      updateRemainingPath(currentLocation);
    }
  }, [currentLocation, isRacing]);

  // --- RACE CONTROLS ---
  const handleStartRace = async () => {
    const locationAllowed = await PermissionManager.requestLocation();
    if (locationAllowed) {
      setPhysicalMeters(0);
      setElapsedTime(0);
      setPath([]);
      setIsRacing(true);
    }
  };

  const handleStopRace = async () => {
    setIsRacing(false);

    // 1. Calculate the potential new streak
    // We call a service that checks if today's run + previous runs form a chain
    const updatedStreak = calculateStreak();

    router.push({
      pathname: "/summary",
      params: {
        meters: Math.floor(physicalMeters),
        seconds: elapsedTime,
        kcal: (physicalMeters * 0.062).toFixed(1),
        xp: Math.floor(physicalMeters * 0.1),
        path: JSON.stringify(path),
        newStreak: updatedStreak, // Pass it to the summary screen to show the user
      },
    });
  };

  // --- FIXED GHOST LOGIC ---
  const toggleGhost = () => {
    if (!isGhostEnabled) {
      // Try adaptive ghost system first (falls back to PB → Ani Pacer)
      const ghostResult = getGhost(1800); // Estimate 30 min run

      if (ghostResult.type === "ani_pacer" || ghostResult.waypoints.length === 0) {
        // No runs saved yet — try raw SQLite fallback for legacy compatibility
        const savedRow: any = getLatestGhostRun();

        if (savedRow && savedRow.path_data) {
          try {
            const rawPath = JSON.parse(savedRow.path_data);
            const parsedPath = rawPath.map((p: any) => ({
              latitude: Number(p.latitude),
              longitude: Number(p.longitude),
              timestamp: Number(p.timestamp),
            }));
            setActiveGhostData(parsedPath);
            setIsGhostEnabled(true);
          } catch (e) {
            console.error("Ghost parse error", e);
            Alert.alert("Error", "Could not load ghost path.");
          }
        } else {
          Alert.alert(
            "No Ghost Found",
            "Save a run first to race against yourself!",
          );
        }
      } else {
        // Use adaptive or PB ghost waypoints
        const ghostData = ghostResult.waypoints.map((wp: any) => ({
          latitude: wp.latitude,
          longitude: wp.longitude,
          timestamp: wp.elapsedMs ?? wp.timestamp ?? 0,
        }));
        setActiveGhostData(ghostData);
        setIsGhostEnabled(true);

        if (ghostResult.type === "adaptive") {
          console.log(
            `[Ghost] Adaptive mode: baseline=${ghostResult.metadata.baselinePace.toFixed(2)}m/s, ` +
            `fatigue@${ghostResult.metadata.predictedFatigue.toFixed(0)}s, ` +
            `confidence=${(ghostResult.metadata.confidence * 100).toFixed(0)}%`
          );
        }
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

  // --- RESONANCE SYSTEM (Updates immediately + every 5 seconds during a run) ---
  useEffect(() => {
    if (!isRacing) {
      setResonance(null);
      return;
    }

    const computeResonance = () => {
      const avgSpeed = elapsedTime > 0 ? physicalMeters / elapsedTime : 0;
      const runContext: RunContext = {
        elapsedTimeS: elapsedTime,
        currentSpeedMps: (currentSpeed || 0) / 3.6, // km/h → m/s
        averageSpeedMps: avgSpeed,
        totalDistanceM: physicalMeters,
        isGhostAhead: false,
      };
      setResonance(getResonanceState(runContext, null, nearbyNodes.length));
    };

    computeResonance(); // immediate
    const interval = setInterval(computeResonance, 5000); // every 5s
    return () => clearInterval(interval);
  }, [isRacing, elapsedTime, physicalMeters, currentSpeed, nearbyNodes.length]);

  // --- CIVIC NODES (Fetch nearby nodes periodically) ---
  useEffect(() => {
    if (!currentLocation) return;

    const fetchNodes = async () => {
      const nodes = await getNearbyNodes(
        currentLocation.latitude,
        currentLocation.longitude,
        500 // 500m radius
      );
      setNearbyNodes(nodes);
    };

    fetchNodes();
    const interval = setInterval(fetchNodes, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  // --- CIVIC REPORT HANDLER ---
  const handleCivicReport = async (category: CivicCategory, photoUri: string) => {
    if (!user || !currentLocation) return;

    // Upload the captured photo to Supabase Storage first
    const photoUrl = await uploadCivicPhoto(user.uid, photoUri);

    const result = await submitCivicReport(
      user.uid,
      currentLocation.latitude,
      currentLocation.longitude,
      category,
      photoUrl ?? undefined,
      compassHeading
    );

    if (result.success) {
      Alert.alert(
        result.consensus_reached ? "Node Verified!" : "Report Submitted",
        result.consensus_reached
          ? "Enough reports confirmed this issue. Civic Quest generated!"
          : "Your report is pending. Others nearby can corroborate it.",
      );
    } else {
      Alert.alert("Report Failed", result.message || "Could not submit report.");
    }
  };

  // --- NODE RECONFIRMATION ---
  const handleReconfirm = async (nodeId: string) => {
    if (!user) return;
    const success = await reconfirmNode(nodeId, user.uid);
    if (success) {
      Alert.alert("Confirmed!", "Node confidence reset. Thanks for verifying!");
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- CAMERA AUTO-FOLLOW ---
  // --- CAMERA AUTO-FOLLOW (FIXED) ---
  useEffect(() => {
    if (isRacing && currentLocation && mapRef.current) {
      if (isProcessing.current) return;

      // --- NEW LOGIC: Check the delay ---
      const timeSinceLastTouch = Date.now() - lastInteractionTime.current;
      if (timeSinceLastTouch < SNAP_BACK_DELAY) {
        // User touched the map recently, skip the auto-center
        return;
      }
      // ----------------------------------

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
        <ActivityIndicator size="large" color={KARELA.color.brand} />
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
        //googleRenderer="LATEST"
        onRegionChangeComplete={(region, isGesture) => {
          // If isGesture is true, the user moved the map manually
          if (isGesture?.isGesture) {
            lastInteractionTime.current = Date.now();
          }
        }}
        customMapStyle={ghostMapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
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
            miterLimit={10}
            zIndex={500}
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
            zIndex={600} // Keep it high so it stays above your own trail
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
            miterLimit={10}
            zIndex={700} // High Z-Index to stay above user path
            geodesic={true}
          />
        )}

        {/* USER TRAIL (Heatmap: Green = Run, Red = Vehicle) */}
        {path.map((point, index) => {
          if (index === 0 || !path[index - 1]) return null;
          const prevPoint = path[index - 1];

          // We define the color here
          const segmentColor = point.isVehicle ? KARELA.color.danger : KARELA.color.brand;

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
              zIndex={800 + index}
              geodesic={true}
            />
          );
        })}

        {/* 2. PLACE YOUR CUSTOM DOT MARKER HERE (Inside MapView) */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            zIndex={999}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#7CF205",
                borderWidth: 3,
                borderColor: "white",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.8,
                shadowRadius: 2,
                elevation: 5,
              }}
            />
          </Marker>
        )}

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

        {/* CIVIC NODE MARKERS */}
        {nearbyNodes.map((node) => (
          <Marker
            key={node.id}
            coordinate={{ latitude: node.latitude, longitude: node.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={400}
            onPress={() => {
              if (node.status === "verified" || node.status === "aging") {
                Alert.alert(
                  `${node.category.replace("_", " ").toUpperCase()}`,
                  `Status: ${node.status} | Confidence: ${(node.confidence * 100).toFixed(0)}%\nReporters: ${node.report_count}`,
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Still There", onPress: () => handleReconfirm(node.id) },
                  ]
                );
              }
            }}
          >
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: node.status === "verified" ? "#FF6B35" : node.status === "aging" ? "#FFB347" : "#888",
              borderWidth: 2,
              borderColor: "#fff",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Ionicons
                name={
                  node.category === "trash" ? "trash" :
                  node.category === "flooding" ? "water" :
                  node.category === "damaged_infrastructure" ? "construct" :
                  node.category === "unsafe_area" ? "alert-circle" : "warning"
                }
                size={14}
                color="#fff"
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* 3D CHARACTER OVERLAY (Fix for iOS & Performance) */}
      {currentLocation && (
        <Marker
          coordinate={currentLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          zIndex={999}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#7CF205",
              borderWidth: 3,
              borderColor: "white",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.8,
              shadowRadius: 2,
              elevation: 5,
            }}
          />
        </Marker>
      )}
      {/* HUD */}
      {isRacing && (
        <View style={styles.hudOverlay}>
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>TIME</Text>
            <Text style={styles.hudValue}>{formatTime(elapsedTime)}</Text>
          </View>
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
            onPress={() => changeCameraHeading("N", currentLocation)}
          >
            <Ionicons name="compass" size={24} color={KARELA.color.gold} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rightButtonBase,
              styles.ghostButton,
              {
                backgroundColor: isGhostEnabled
                  ? KARELA.color.brand
                  : "rgba(0,0,0,0.85)",
              },
            ]}
            onPress={toggleGhost}
          >
            <Ionicons
              name="flash"
              size={24}
              color={isGhostEnabled ? "black" : KARELA.color.gold}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rightButtonBase, styles.flagSpawner]}
            onPress={handleSpawnFlag}
          >
            {checkpoints.length > 0 && (
              <View style={styles.flagCountBadge}>
                <Text
                  style={{ color: KARELA.color.textPrimary, fontSize: KARELA.size.caption, fontFamily: KARELA.font.bold }}
                >
                  {checkpoints.length}
                </Text>
              </View>
            )}
            <Ionicons name="flag" size={24} color={KARELA.color.gold} />
          </TouchableOpacity>
        </>      )}

      {/* CIVIC HUD — Resonance indicator + Report FAB + Report sheet */}
      <CivicHUD
        isRacing={isRacing}
        resonance={resonance}
        nearbyCount={nearbyNodes.length}
        onSubmitReport={handleCivicReport}
      />

      {/* ACTION BUTTON */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isRacing ? KARELA.color.danger : KARELA.color.brand },
          ]}
          onPress={() => (isRacing ? handleStopRace() : handleStartRace())}
        >
          <Text style={styles.buttonText}>{isRacing ? "STOP" : "START"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

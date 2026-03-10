// app/dashboard/maps.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator, Alert, Platform } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

// Hooks & Services
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { useQuestEngine } from "@/hooks/useQuestEngine";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { MAP_CONFIG, styles } from "@/styles/mapStyles";
import { getLatestGhostRun } from "@/services/database/database"; 

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [hasZoomed, setHasZoomed] = useState(false);
  const isProcessing = useRef(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // --- NEW GHOST STATE ---
  const [isGhostEnabled, setIsGhostEnabled] = useState(false);
  const [activeGhostData, setActiveGhostData] = useState<any[]>([]);

  // --- HOOKS ---
  const {
    path,
    setPath,
    ghostPosition,
    isRacing,
    setIsRacing,
    currentLocation,
    currentSpeed,
    compassHeading,
  } = useLocationEngine(activeGhostData);

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

  // --- TOGGLE GHOST LOGIC ---
  const toggleGhost = () => {
    if (!isGhostEnabled) {
      const savedData = getLatestGhostRun();
      if (savedData) {
        setActiveGhostData(savedData);
        setIsGhostEnabled(true);
      } else {
        Alert.alert("No Ghost Found", "Save a run first to race against yourself!");
      }
    } else {
      setIsGhostEnabled(false);
      setActiveGhostData([]);
    }
  };

  // --- NAVIGATION TO SUMMARY ---
  const handleStopRace = () => {
    setIsRacing(false);
    
    router.push({
      pathname: "/dashboard/summary",
      params: {
        meters: Math.floor(totalDistance),
        seconds: elapsedTime,
        kcal: (totalDistance * 0.062).toFixed(1),
        xp: Math.floor(totalDistance * 0.1),
        path: JSON.stringify(path) 
      }
    });
  };

  // --- CHECKPOINT SPAWNER ---
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
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRacing]);

  // Formatter
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- PATH EATING LOGIC ---
  useEffect(() => {
    if (isRacing && currentLocation) {
      updateRemainingPath(currentLocation);
    }
  }, [currentLocation, isRacing]);

  // --- CAMERA LOGIC ---
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
        provider="google"
        googleRenderer="LATEST"
        customMapStyle={ghostMapStyle}
        showsUserLocation={true}
        followsUserLocation={false}
        rotateEnabled={true}
        showsTraffic={false} 
        showsIndoors={false}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* DYNAMIC GHOST LINE */}
        {isGhostEnabled && activeGhostData.length > 1 && (
          <Polyline 
            coordinates={activeGhostData.map(p => ({ latitude: p.latitude, longitude: p.longitude }))} 
            {...MAP_CONFIG.futurePath} 
            strokeColor="rgba(255, 215, 0, 0.4)" 
          />
        )}

        {/* QUEST ROUTE */}
        {questPath.length > 1 && (
          <Polyline coordinates={[currentLocation, ...questPath.slice(1)]} {...MAP_CONFIG.questPath} />
        )}

        {/* SEGMENTED USER TRAIL */}
        {path.map((point, index) => {
          if (index === 0 || !path[index - 1]) return null;
          const prevPoint = path[index - 1];

          return (
            <Polyline
              key={`segment_${index}_${point.latitude}`}
              coordinates={[
                { latitude: prevPoint.latitude, longitude: prevPoint.longitude }, 
                { latitude: point.latitude, longitude: point.longitude }
              ]}
              strokeColor={point.isVehicle ? "#FF3B30" : "#7CF205"}
              strokeWidth={8}
              lineCap="round" 
              lineJoin="round" 
              geodesic={false}
              zIndex={2000 + index}
              lineDashPattern={Platform.OS === 'ios' ? [1000, 0] : undefined}
            />
          );
        })}

        {/* GHOST MARKER */}
        {isGhostEnabled && ghostPosition && (
          <Marker coordinate={ghostPosition} anchor={{ x: 0.5, y: 0.5 }} flat>
            <View style={styles.markerWrapper}>
              <View style={[styles.ghostMarker, { backgroundColor: '#FFD700' }]} />
            </View>
          </Marker>
        )}

        {/* FLAGS/CHECKPOINTS */}
        {checkpoints.map((point, index) => (
          <Marker
            key={point.id}
            draggable={!isRacing}
            coordinate={point}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={async (e) => {
              setIsDragging(false);
              setIsOverTrash(false);
              const dropped = e.nativeEvent.coordinate;
              const camera = await mapRef.current?.getCamera();
              if (camera && camera.center.latitude - dropped.latitude > 0.0015) {
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

      {/* HUD OVERLAY */}
      {isRacing && (
        <View style={styles.hudOverlay}>
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>TIME</Text>
            <Text style={styles.hudValue}>{formatTime(elapsedTime)}</Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>KM/H</Text>
            <Text style={[styles.hudValue, (currentSpeed ?? 0) > 35 && { color: "#FF3B30" }]}>
              {currentSpeed ?? 0}
            </Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>METERS</Text>
            <Text style={styles.hudValue}>{Math.floor(totalDistance)}</Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>KCAL</Text>
            <Text style={styles.hudValue}>{(totalDistance * 0.062).toFixed(1)}</Text>
          </View>
          <View style={styles.hudDivider} />
          <View style={styles.hudStat}>
            <Text style={styles.hudLabel}>GOAL</Text>
            <Text style={styles.hudValue}>
              {checkpoints.filter((f) => (f as any).isReached).length}/{checkpoints.length}
            </Text>
          </View>
        </View>
      )}

      {/* TOOLS */}
      {!isRacing && (
        <>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>

          {/* COMPASS */}
          <TouchableOpacity 
            style={[styles.rightButtonBase, styles.compassButton]} 
            onPress={() => changeCameraHeading("N")}
          >
            <Ionicons name="compass" size={24} color="#FFD700" />
          </TouchableOpacity>

          {/* GHOST */}
          <TouchableOpacity
            style={[
              styles.rightButtonBase, 
              styles.ghostButton, 
              { backgroundColor: isGhostEnabled ? "#7CF205" : "rgba(0,0,0,0.85)" }
            ]}
            onPress={toggleGhost}
          >
            <Ionicons name="flash" size={24} color={isGhostEnabled ? "black" : "#FFD700"} />
          </TouchableOpacity>

          {/* FLAG SPAWNER */}
          <TouchableOpacity 
            style={[styles.rightButtonBase, styles.flagSpawner]} 
            onPress={handleSpawnFlag}
          >
            {checkpoints.length > 0 && (
              <View style={styles.flagCountBadge}>
                <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>{checkpoints.length}</Text>
              </View>
            )}
            <Ionicons name="flag" size={24} color="#FFD700" />
          </TouchableOpacity>
        </>
      )}

      {/* ACTION BUTTON */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isRacing ? "#FF3B30" : "#7CF205" }]}
          onPress={() => isRacing ? handleStopRace() : setIsRacing(true)}
        >
          <Text style={styles.buttonText}>{isRacing ? "STOP" : "START"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
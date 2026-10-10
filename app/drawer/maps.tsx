import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Platform,
  Text,
  View,
} from "react-native";
import MapView, { Circle, Marker, Polyline, Region } from "react-native-maps";

// Hooks & Services
import { CivicHUD } from "@/components/CivicHUD";
import { gpsQuality, RunHUD } from "@/components/run/RunHUD";
import { UserMarker } from "@/components/run/UserMarker";
import { clockText, kmText, MIN_SAVE_M, paceFor, pathDistance } from "@/services/runMath";
import { Button, IconButton } from "@/components/ui/Button";
import { NodeDetailModal } from "@/components/NodeDetailModal";
import { useAuth } from "@/context/AuthContext";
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { useRouteBuilder } from "@/hooks/useRouteBuilder";
import { getLatestGhostRun } from "@/services/database/sqlite/database";
import {
  CivicCategory,
  CivicNode,
  describeConsensus,
  getNearbyNodes,
  getNodeReportCount,
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
import { useLocalSettings } from "@/services/localSettings";
import { PermissionManager } from "@/services/PermissionsManager";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { bayanihanMapStyle, ghostMapStyle } from "@/styles/ghostMapStyle";
import { civicXpMultiplier, useBuffs } from "@/services/buffs";
import { guildColor } from "@/services/guilds";
import { getTerritories, HOLDER_REASON, LandmarkState } from "@/services/territory";
import { styles } from "@/styles/mapStyles";
import {
  discardRun,
  endInterruptedRun,
  endRun,
  getUnsavedRun,
  saveRunProgress,
  startRun,
} from "@/services/runOutbox";

/**
 * strokeColors only exists to stop Google Maps (Android) drawing lines in
 * its default blue. On iPhone (Apple Maps) any strokeColors array switches
 * the line to react-native-maps' custom gradient renderer instead of Apple's
 * own; adding a flag (gold geodesic route) crashed there. iPhone uses plain
 * strokeColor and Apple's built-in renderer.
 */
const androidStrokeColors = (points: number, color: string) =>
  Platform.OS === "android" ? Array.from({ length: points }, () => color) : undefined;

export default function MapScreen() {
  const router = useRouter();
  const { user, earnGems, gainXP } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [hasZoomed, setHasZoomed] = useState(false);
  const [mapHeading, setMapHeading] = useState(0);
  const isProcessing = useRef(false);
  // Time comes from the clock (Date.now), never from counting ticks, so it
  // stays right if the phone is slow or the app was in the background.
  const [elapsedTime, setElapsedTime] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const pausedMsRef = useRef(0); // total paused time before the current pause
  const pauseStartRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  // Path segments recorded while paused don't count: [from, to] segment indexes.
  const [pauseRanges, setPauseRanges] = useState<{ from: number; to: number | null }[]>([]);
  // The run's id in the outbox (services/runOutbox.ts), from Start to End.
  const runIdRef = useRef<string | null>(null);
  const lastInteractionTime = useRef<number>(0);
  const SNAP_BACK_DELAY = 15000; // 15 seconds in milliseconds

  // --- GHOST STATE ---
  const [isGhostEnabled, setIsGhostEnabled] = useState(false);
  const [activeGhostData, setActiveGhostData] = useState<any[]>([]);

  // --- CIVIC STATE ---
  const [nearbyNodes, setNearbyNodes] = useState<CivicNode[]>([]);
  const [resonance, setResonance] = useState<ResonanceState | null>(null);
  const [selectedNode, setSelectedNode] = useState<CivicNode | null>(null);

  // --- HOOKS ---
  const {
    path,
    ghostPosition,
    isRacing,
    currentLocation,
    currentSpeed,
    compassHeading,
    gpsAccuracy,
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
  } = useRouteBuilder(mapRef);

  // --- DISTANCE: one sum over the whole path (services/runMath.ts) ---
  // The same rule the summary and the saved run use, so they always agree.
  const physicalMeters = useMemo(
    () =>
      pathDistance(path, (i) =>
        pauseRanges.some((r) => i > r.from && (r.to === null || i <= r.to)),
      ),
    [path, pauseRanges],
  );
  const lastPoint = path[path.length - 1];
  const inVehicle = !!lastPoint?.isVehicle && !isPaused;
  const avgPaceS = paceFor(physicalMeters, elapsedTime);

  // --- SHOP AND GUILD: trail colour, map theme, landmark zones ---
  const buffs = useBuffs();
  const trailColors = buffs.trail?.length ? buffs.trail : [KARELA.color.brand];
  const [landmarks, setLandmarks] = useState<LandmarkState[]>([]);
  useEffect(() => {
    let alive = true;
    getTerritories()
      .then((t) => alive && setLandmarks(t.landmarks))
      .catch(() => {}); // not set up yet or offline: the map just has no zones
    return () => {
      alive = false;
    };
  }, []);

  // --- KEEP SCREEN ON (Settings > Keep screen on during runs) ---
  const localSettings = useLocalSettings();
  const keepScreenOn = !!localSettings?.keepScreenOn;
  useEffect(() => {
    if (!isRacing || !keepScreenOn) return;
    const tag = "karela-run";
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [isRacing, keepScreenOn]);

  // --- SYNC ENGINE ---
  useEffect(() => {
    if (isRacing && currentLocation) {
      updateRemainingPath(currentLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, isRacing]);

  // --- RACE CONTROLS ---
  const resetRunClock = () => {
    startedAtRef.current = null;
    pausedMsRef.current = 0;
    pauseStartRef.current = null;
    setIsPaused(false);
    setPauseRanges([]);
    setElapsedTime(0);
  };

  const handleStartRace = async () => {
    if (!user) return;
    const locationAllowed = await PermissionManager.requestLocation();
    if (locationAllowed) {
      resetRunClock();
      runIdRef.current = startRun(user.uid);
      startedAtRef.current = Date.now();
      setPath([]);
      setIsRacing(true);
    }
  };

  const togglePause = () => {
    const now = Date.now();
    if (!isPaused) {
      pauseStartRef.current = now;
      setPauseRanges((r) => [...r, { from: path.length - 1, to: null }]);
      setIsPaused(true);
    } else {
      if (pauseStartRef.current) pausedMsRef.current += now - pauseStartRef.current;
      pauseStartRef.current = null;
      // The next point recorded bridges the pause; it doesn't count either.
      setPauseRanges((r) => r.map((x) => (x.to === null ? { ...x, to: path.length } : x)));
      setIsPaused(false);
    }
    tickClock();
  };

  const finishRun = async () => {
    const id = runIdRef.current;
    const seconds = currentElapsed();
    const meters = Math.floor(physicalMeters);
    setIsRacing(false);
    resetRunClock();
    runIdRef.current = null;
    if (!id) return;
    try {
      await endRun(id, meters, seconds, path);
    } catch (e) {
      console.error("Run not saved on the phone:", e);
      Alert.alert("Run not saved", "This run couldn't be saved on your phone. Free up some space and try again next run.");
      return;
    }
    // The summary reads the run from the phone by id, never numbers from the link.
    router.push({ pathname: "/summary", params: { id } });
  };

  const handleStopRace = () => {
    if (physicalMeters < MIN_SAVE_M) {
      Alert.alert(
        "End this run?",
        `You've covered less than ${MIN_SAVE_M} m, so there's nothing to save yet.`,
        [
          { text: "Keep going", style: "cancel" },
          {
            text: "Discard run",
            style: "destructive",
            onPress: () => {
              if (runIdRef.current) discardRun(runIdRef.current);
              runIdRef.current = null;
              setIsRacing(false);
              resetRunClock();
              setPath([]);
            },
          },
        ],
      );
      return;
    }
    Alert.alert("End this run?", `${kmText(physicalMeters)} km in ${clockText(currentElapsed())}.`, [
      { text: "Keep going", style: "cancel" },
      { text: "End run", onPress: finishRun },
    ]);
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
            Alert.alert("Couldn't load your ghost", "Try again, or race without a ghost.");
          }
        } else {
          Alert.alert(
            "No ghost yet",
            "Finish and save a run first. Then you can race against it.",
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

  // --- FLAG PLACEMENT MODE ---
  // Tap the flag button (or "Move" on a flag): a marker sits fixed in the
  // centre of the screen, the user drags the map under it, then confirms.
  // The centre is tracked from onRegionChangeComplete, so we never ask the
  // native map for its camera (that call was a crash suspect on iPhone).
  const [placing, setPlacing] = useState<null | { mode: "add" } | { mode: "move"; index: number }>(null);
  const mapCenter = useRef<{ latitude: number; longitude: number } | null>(null);

  const handleSpawnFlag = () => setPlacing({ mode: "add" });

  const handleRegionChange = (region: Region, details?: { isGesture?: boolean }) => {
    mapCenter.current = { latitude: region.latitude, longitude: region.longitude };
    // iPhone (Apple Maps) can't rotate markers with the map, so the arrow
    // needs the map's rotation. Android markers turn with the map by themselves.
    if (Platform.OS === "ios" && mapRef.current) {
      mapRef.current
        .getCamera()
        .then((c) => setMapHeading((prev) => (Math.abs((c.heading ?? 0) - prev) >= 1 ? c.heading ?? 0 : prev)))
        .catch(() => {});
    }
    // The user moved the map by hand: pause auto-follow for a while.
    // Runs on a map event, never during render (the purity rule cannot tell).
    // eslint-disable-next-line react-hooks/purity
    if (details?.isGesture) lastInteractionTime.current = Date.now();
  };

  const confirmPlacement = () => {
    const center = mapCenter.current ?? currentLocation;
    if (center && placing) {
      const point = { latitude: center.latitude, longitude: center.longitude };
      if (placing.mode === "add") addCheckpoint(point, currentLocation);
      else moveCheckpoint(placing.index, point, currentLocation);
    }
    setPlacing(null);
  };

  // --- RUN CLOCK ---
  // Seconds since Start, minus paused time, read from the clock.
  function currentElapsed() {
    if (!startedAtRef.current) return 0;
    const now = Date.now();
    const pausedNow = pauseStartRef.current ? now - pauseStartRef.current : 0;
    return Math.max(0, Math.floor((now - startedAtRef.current - pausedMsRef.current - pausedNow) / 1000));
  }
  function tickClock() {
    setElapsedTime(currentElapsed());
  }

  // --- SAVE PROGRESS (every 20 s), so a killed app doesn't lose the run ---
  const liveRef = useRef({ path, meters: physicalMeters });
  useEffect(() => {
    liveRef.current = { path, meters: physicalMeters };
  }, [path, physicalMeters]);
  useEffect(() => {
    if (!isRacing) return;
    const save = () => {
      const id = runIdRef.current;
      if (!id) return;
      saveRunProgress(id, liveRef.current.meters, currentElapsed(), liveRef.current.path).catch((e) =>
        console.warn("Run progress not saved:", e),
      );
    };
    const interval = setInterval(save, 20_000);
    // Leaving the app is when it's most likely to be killed: save now.
    const sub = AppState.addEventListener("change", (st) => {
      if (st !== "active") save();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [isRacing]);

  // --- A RUN THAT WAS CUT OFF (app killed) or never saved ---
  // Checked when the screen opens, not when a run ends here.
  const racingRef = useRef(isRacing);
  useEffect(() => {
    racingRef.current = isRacing;
  }, [isRacing]);
  useFocusEffect(
    useCallback(() => {
      if (!user || racingRef.current) return;
      const run = getUnsavedRun(user.uid);
      if (!run) return;
      const openSummary = () => {
        if (run.state === "active") endInterruptedRun(run.id);
        router.push({ pathname: "/summary", params: { id: run.id } });
      };
      if (run.meters < MIN_SAVE_M) {
        discardRun(run.id); // too short to be worth asking about
        return;
      }
      const when = new Date(run.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      Alert.alert(
        "You have an unsaved run",
        `${kmText(run.meters)} km in ${clockText(run.seconds)}, started at ${when}. Save it, or discard it?`,
        [
          { text: "Discard", style: "destructive", onPress: () => discardRun(run.id) },
          { text: "Review and save", onPress: openSummary },
        ],
        { cancelable: false },
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]),
  );

  useEffect(() => {
    if (!isRacing) return;
    tickClock();
    const interval = setInterval(tickClock, 1000);
    // Coming back from the background: show the right time straight away.
    const sub = AppState.addEventListener("change", (st) => {
      if (st === "active") tickClock();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (result.consensus_reached) {
        // Node verified — full reward
        const boost = civicXpMultiplier(buffs);
        await gainXP(Math.round(200 * boost));
        await earnGems(20);
        Alert.alert(
          "Report verified",
          `Neighbours confirmed this issue.\n+200 XP, +20 Gems${boost > 1 ? "\nBayanihan Boost: +25% XP" : ""}`,
        );
      } else {
        // Report submitted — small reward
        const boost = civicXpMultiplier(buffs);
        await gainXP(Math.round(50 * boost));
        await earnGems(5);
        const count = result.node_id ? await getNodeReportCount(result.node_id) : null;
        const progress =
          count != null
            ? describeConsensus(count)
            : "It stays pending until 3 people nearby report it.";
        Alert.alert("Report sent", `${progress}\n+50 XP, +5 Gems${boost > 1 ? "\nBayanihan Boost: +25% XP" : ""}`);
      }
    } else {
      Alert.alert("Report not sent", result.message || "Check your connection and try again.");
    }
  };

  // --- NODE RECONFIRMATION ---
  const handleReconfirm = async (nodeId: string) => {
    if (!user) return;
    const success = await reconfirmNode(nodeId, user.uid);
    if (success) {
      Alert.alert("Thanks for checking", "You confirmed it's still there, so it stays on the map longer.");
    }
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
        { duration: 1000 },
      );

      // Let each camera move finish before the next one starts, so turns
      // glide instead of being cut off halfway.
      setTimeout(() => {
        isProcessing.current = false;
      }, 1000);
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
            backgroundColor: KARELA.color.surface,
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
        // Google + ghostMapStyle on Android; Apple Maps' own dark mode on iOS
        // (Google Maps needs extra native setup on iOS and is blank in Expo Go).
        provider={Platform.OS === "android" ? "google" : undefined}
        userInterfaceStyle="dark"
        //googleRenderer="LATEST"
        onRegionChangeComplete={handleRegionChange}
        customMapStyle={buffs.guild_map_theme ? bayanihanMapStyle : ghostMapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* --- LANDMARK TERRITORY (guilds) --- */}
        {landmarks.map((l) => {
          const color = l.holder.guild_id ? guildColor(l.holder.color) : KARELA.color.textMuted;
          return (
            <React.Fragment key={`landmark_${l.id}`}>
              <Circle
                center={{ latitude: l.latitude, longitude: l.longitude }}
                radius={l.radius_m}
                strokeColor={color}
                strokeWidth={2}
                fillColor={l.holder.guild_id ? `${color}22` : "rgba(147,158,143,0.08)"}
                zIndex={50}
              />
              <Marker
                coordinate={{ latitude: l.latitude, longitude: l.longitude }}
                title={l.name}
                description={l.holder.guild_id ? `${l.holder.name}: ${HOLDER_REASON[l.holder.reason].toLowerCase()}` : "Unclaimed. Guilds win it by running here."}
                tracksViewChanges={false}
                anchor={{ x: 0.5, y: 1 }}
              >
                <KarelaIcon name="territory" size={24} color={color} />
              </Marker>
            </React.Fragment>
          );
        })}

        {/* --- GHOST ENGINE LAYER --- */}
        {/* GHOST LINE (The static path of the saved run) */}
        {isGhostEnabled && activeGhostData.length > 1 && (
          <Polyline
            coordinates={activeGhostData}
            strokeColor="rgba(255, 215, 0, 0.4)"
            strokeColors={androidStrokeColors(activeGhostData.length, "rgba(255, 215, 0, 0.4)")}
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
                backgroundColor: KARELA.color.gold,
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
        {/* Needs a GPS fix: the line starts at the user. */}
        {questPath.length > 1 && currentLocation && (
          <Polyline
            coordinates={[currentLocation, ...questPath.slice(1)]}
            strokeColor={KARELA.color.gold}
            strokeColors={androidStrokeColors(questPath.length, KARELA.color.gold)}
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
          // Coral always means "vehicle". Otherwise the trail bought in the
          // Shop; several colours shift along the run.
          const segmentColor = point.isVehicle
            ? KARELA.color.danger
            : trailColors[Math.min(trailColors.length - 1, Math.floor((index * trailColors.length) / path.length))];

          return (
            <Polyline
              key={`trail_${index}`}
              coordinates={[prevPoint, point]}
              // FIX: We provide both singular and plural to override the native driver
              strokeColor={segmentColor}
              strokeColors={androidStrokeColors(2, segmentColor)}
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
              // Extremely high Z-Index to stay on top of any hidden Google layers
              zIndex={800 + index}
              geodesic={true}
            />
          );
        })}

        {/* You: dot plus an arrow for the way you're facing */}
        {currentLocation && <UserMarker coordinate={currentLocation} mapHeading={mapHeading} />}

        {/* FLAGS (Checkpoints)
            Kept as simple as the report pins below, which work on both
            platforms. A Callout tooltip on these pins crashed the app on
            iPhone (Apple Maps, new architecture) the moment a flag was added,
            so management happens in a plain Alert instead. Dragging stays on
            Android; on iPhone "Move here" moves the flag to the map centre. */}
        {checkpoints.map((point, index) => {
          if ((point as any).isReached) return null;

          return (
            <Marker
              key={point.id}
              draggable={Platform.OS === "android" && !isRacing}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              // Bottom of the pin = the spot (matches the placement indicator).
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -29 }}
              onDragEnd={(e) => {
                moveCheckpoint(index, e.nativeEvent.coordinate, currentLocation);
              }}
              onPress={() => {
                if (isRacing) return;
                Alert.alert(`Checkpoint ${index + 1}`, "Move it to a new spot or delete it.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Move",
                    onPress: () => {
                      // Centre the map on this flag, then let the user drag.
                      mapRef.current?.animateCamera(
                        { center: { latitude: point.latitude, longitude: point.longitude } },
                        { duration: 300 },
                      );
                      mapCenter.current = { latitude: point.latitude, longitude: point.longitude };
                      setPlacing({ mode: "move", index });
                    },
                  },
                  {
                    text: "Delete flag",
                    style: "destructive",
                    onPress: () => deleteCheckpoint(index, currentLocation),
                  },
                ]);
              }}
              accessibilityLabel={`Checkpoint ${index + 1}`}
            >
              <View style={{ alignItems: "center" }}>
                <View style={styles.checkpointLabel}>
                  <Text style={styles.checkpointText}>{index + 1}</Text>
                </View>
                <Ionicons name="flag" size={36} color={KARELA.color.gold} />
              </View>
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
            onPress={() => setSelectedNode(node)}
          >
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: node.status === "verified" ? KARELA.color.brand : node.status === "aging" ? KARELA.color.civic : KARELA.color.textMuted,
              borderWidth: 2,
              borderColor: KARELA.color.textPrimary,
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
                color={KARELA.color.onBright}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* HUD */}
      {isRacing && (
        <RunHUD
          meters={physicalMeters}
          seconds={elapsedTime}
          avgPaceS={avgPaceS}
          speedKmh={currentSpeed ?? 0}
          gps={gpsQuality(gpsAccuracy, !!currentLocation)}
          paused={isPaused}
          inVehicle={inVehicle}
          flags={
            checkpoints.length > 0
              ? { reached: checkpoints.filter((f) => (f as any).isReached).length, total: checkpoints.length }
              : undefined
          }
        />
      )}

      {/* TOOLS (Only visible when NOT racing, and not while placing a flag) */}
      {!isRacing && !placing && (
        <>
          <IconButton
            icon="chevron-back"
            label="Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />

          <IconButton
            icon="compass-outline"
            label="Point the map north"
            onPress={() => changeCameraHeading("N", currentLocation)}
            style={[styles.rightButtonBase, styles.compassButton]}
          />

          <IconButton
            icon="flash"
            label={isGhostEnabled ? "Hide your ghost" : "Race your ghost"}
            tone={isGhostEnabled ? "brand" : "surface"}
            onPress={toggleGhost}
            style={[styles.rightButtonBase, styles.ghostButton]}
            accessibilityState={{ selected: isGhostEnabled }}
          />

          <View style={[styles.rightButtonBase, styles.flagSpawner]}>
            <IconButton icon="flag-outline" label="Add a checkpoint" onPress={handleSpawnFlag} />
            {checkpoints.length > 0 && (
              <View style={styles.flagCountBadge} pointerEvents="none">
                <Text style={styles.flagCountText}>{checkpoints.length}</Text>
              </View>
            )}
          </View>
        </>      )}

      {/* CIVIC HUD — Resonance indicator + Report FAB + Report sheet */}
      {!placing && (
      <CivicHUD
        isRacing={isRacing}
        resonance={resonance}
        // Reports nearby that need someone: pending ones need more reports,
        // aging ones need a "still there?" check.
        needsCheckCount={
          nearbyNodes.filter((n) => n.status === "pending" || n.status === "aging").length
        }
        onSubmitReport={handleCivicReport}
      />
      )}

      {/* NODE DETAIL MODAL */}
      <NodeDetailModal
        visible={!!selectedNode}
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onReconfirm={handleReconfirm}
      />

      {/* PLACEMENT INDICATOR: the flag's pole tip marks the exact spot */}
      {placing && (
        <View style={styles.placeOverlay} pointerEvents="none">
          <View style={styles.placePin}>
            <Ionicons name="flag" size={40} color={KARELA.color.gold} />
          </View>
          <View style={styles.placeDot} />
        </View>
      )}

      {/* ACTION BUTTON (box-none: drags on either side reach the map) */}
      <View style={styles.buttonContainer} pointerEvents="box-none">
        {placing ? (
          <View style={styles.placeBar}>
            <Text style={styles.placeTitle}>
              {placing.mode === "add" ? "Place a checkpoint" : `Move checkpoint ${placing.index + 1}`}
            </Text>
            <Text style={styles.placeHint}>Drag the map to put the flag where you want it.</Text>
            <View style={styles.placeActions}>
              <Button label="Cancel" variant="secondary" size="sm" onPress={() => setPlacing(null)} style={{ flex: 1 }} block />
              <Button
                label={placing.mode === "add" ? "Place flag here" : "Move flag here"}
                icon="flag"
                size="sm"
                onPress={confirmPlacement}
                style={{ flex: 1.4 }}
                block
              />
            </View>
          </View>
        ) : (
          isRacing ? (
            <View style={styles.runControls}>
              <Button
                label={isPaused ? "Resume" : "Pause"}
                variant={isPaused ? "primary" : "secondary"}
                icon={isPaused ? "play" : "pause"}
                onPress={togglePause}
                style={{ flex: 1 }}
                block
              />
              <Button label="End" variant="danger" icon="stop" onPress={handleStopRace} style={{ flex: 1 }} block />
            </View>
          ) : (
            <Button label="Start" icon="play" onPress={handleStartRace} style={[styles.actionButton, KARELA.glow.brand]} />
          )
        )}
      </View>
    </View>
  );
}

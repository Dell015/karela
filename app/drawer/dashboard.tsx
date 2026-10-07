import { TodayCard } from "@/components/TodayCard";
import { getNearbyNodes } from "@/services/engines/CivicEngine";
import { dayKey } from "@/services/calendarData";
import { getEffectiveStreak } from "@/services/streakService";
import { Button, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { QuestCard } from "@/components/QuestCard";
import { KARELA } from "@/styles/designSystem";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useIsFocused, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    Pressable,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import MapView from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom Hooks & Styles
import AniView from "@/components/AniModel";
import { DynamicDock } from "@/components/DynamicDock";
import { PlayerCard } from "@/components/PlayerCard";
import { useAuth } from "@/context/AuthContext";
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { QuestEngine } from "@/services/engines/QuestEngine";
import {
    subscribeToMissions,
} from "@/services/database/supabase/missions";
import { dashboard_ui } from "@/styles/dashboardStyle";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { getWeatherLine, getWeatherTier, WeatherTier } from "@/services/weatherSafety";
import type { DrawerNavigationProp } from "expo-router/drawer";


export default function Dashboard() {
  const { profile, loading } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [activeGhostData] = useState<any[]>([]);

  // Extracting currentLocation and compassHeading to drive the map and recenter logic
  const { currentLocation, compassHeading } =
    useLocationEngine(activeGhostData);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const currentXP = Number(profile?.stats?.xp || 0);
  const currentLevel = Number(profile?.stats?.level || 1);
  const currentStreak = getEffectiveStreak(profile?.stats);
  const lastActive = profile?.stats?.last_active_date;
  const ranToday = !!lastActive && dayKey(new Date(lastActive)) === dayKey(new Date());
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [currentAniAction, setCurrentAniAction] = useState(
    "Female_rig|female_IDLE",
  );
  const [activeMissions, setActiveMissions] = useState<any[]>([]);

  const isFocused = useIsFocused();

  // Nearby reports that need someone, for the Today card. Fetched once per
  // visit to this screen, not on every GPS fix (prepaid data).
  const [needsCheckCount, setNeedsCheckCount] = useState(0);
  const nodesFetched = useRef(false);
  useEffect(() => {
    if (!isFocused) {
      nodesFetched.current = false;
      return;
    }
    if (nodesFetched.current || !currentLocation?.latitude) return;
    nodesFetched.current = true;
    getNearbyNodes(currentLocation.latitude, currentLocation.longitude, 500).then((nodes) =>
      setNeedsCheckCount(nodes.filter((n) => n.status === "pending" || n.status === "aging").length),
    );
  }, [isFocused, currentLocation?.latitude, currentLocation?.longitude]);

  useEffect(() => {
    if (isFocused) {
      console.log(
        "Dashboard Focused. Current XP from Context:",
        profile?.stats?.xp,
      );
    }
  }, [isFocused, profile]);

  const [weather, setWeather] = useState<{
    temp: string | number;
    desc: string;
    city: string;
    icon: string;
    tier: WeatherTier | null; // null until real weather has loaded
    status: "loading" | "ok" | "unavailable";
  }>({
    temp: "--",
    desc: "Loading...",
    city: "Unknown",
    icon: "01d",
    tier: null,
    // Without a key there is nothing to load, so say so instead of "Checking..." forever.
    status: process.env.EXPO_PUBLIC_WEATHER_API_KEY ? "loading" : "unavailable",
  });

  // --- RECENTER LOGIC ---
  // This function snaps the camera back to the user with a 3D perspective
  const recenterMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          heading: compassHeading || 0, // Faces the direction the user is pointing
          pitch: 55, // 3D Tilt
          zoom: 18, // Cinematic zoom level for dashboard
        },
        { duration: 1000 },
      );
    }
  };

  // Keyboard Listeners for UI adjustments
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const fetchWeather = async (cityName: string) => {
    try {
      const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
      if (!API_KEY) return;
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.cod === 200 && data.main) {
        setWeather({
          temp: Math.round(data.main.temp),
          desc: data.weather[0].description,
          city: data.name,
          icon: data.weather[0].icon,
          tier: getWeatherTier(data),
          status: "ok",
        });
      } else {
        setWeather((prev) => ({ ...prev, status: "unavailable" }));
      }
    } catch (error) {
      console.error("Weather Fetch failed:", error);
      setWeather((prev) => ({ ...prev, status: "unavailable" }));
    }
  };

  useEffect(() => {
    fetchWeather("Tuguegarao");
  }, []);

  useEffect(() => {
    if (!profile?.uid) return;

    // Realtime subscription to active daily solo missions
    const unsubscribe = subscribeToMissions(
      profile.uid,
      { status: "active", category: "solo", frequency: "daily" },
      (rows) => {
        const fetchedMissions = rows.slice(0, 5).map((data) => {
          const prog =
            data.target_value > 0 ? data.current_value / data.target_value : 0;
          return {
            id: data.id,
            mission: data.title || "Unknown Mission",
            progress: Math.min(prog, 1.0),
            xp: data.xp_reward || 0,
            frequency: data.frequency,
          };
        });
        setActiveMissions(fetchedMissions);
      },
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  // Track whether we've already attempted quest gen this session to avoid retry loops
  const questGenAttempted = useRef(false);

  useEffect(() => {
    const triggerDailyReset = async () => {
      // 1. Guard: Don't run if still loading or data is missing
      if (loading || !profile?.uid || !profile?.stats) return;

      const today = new Date().toISOString().split("T")[0];
      const lastDaily = profile.stats.last_daily_reset;

      // Already done today OR already attempted this session — skip entirely
      if (lastDaily === today || questGenAttempted.current) return;

      questGenAttempted.current = true; // Mark as attempted (even if it fails)
      console.log("Dashboard: New day detected. Initializing Quest Engine...");

      try {
        const result = await QuestEngine.generateQuests({
          userId: profile.uid,
          stats: profile.stats,
          decayModel: null, // TODO: Load from GhostModelManager when available
          runHistory: [],
        });

        if (result.errors.length > 0) {
          console.warn("Quest Engine errors:", result.errors);
        }
        if (result.generated.length > 0) {
          console.log("Quest Engine generated:", result.generated);
        }
      } catch (error) {
        console.error("Quest Engine Error:", error);
      }
    };

    if (isFocused && !loading) {
      triggerDailyReset();
    }
  }, [isFocused, profile, loading]); // Added profile and loading for better sync

  return (
    <Screen variant="default">
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: "transparent" }}
            contentContainerStyle={{
              paddingBottom: isKeyboardVisible ? 20 : 160,
              backgroundColor: "transparent",
            }}
          >
            <View style={dashboard_ui.dashboard}>
              {/* Profile Header */}
              <View style={dashboard_ui.ProfileHeader}>
                <View style={dashboard_ui.LeftGroup}>
                  <TouchableOpacity
                    onPress={() => router.push("/drawer/profile")}
                    accessibilityRole="button"
                    accessibilityLabel="Your profile"
                  >
                    {/* No profile photos yet: show the first letter of the name. */}
                    <View style={[dashboard_ui.Image, dashboard_ui.avatarInitial]}>
                      <Text style={dashboard_ui.avatarInitialText}>
                        {(profile?.displayName || "S").trim().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View>
                    <Text style={dashboard_ui.welcomeText}>Welcome back</Text>
                    <Text style={dashboard_ui.nameText}>
                      {profile?.displayName || "Strider"}
                    </Text>
                    <Text style={dashboard_ui.LevelLabel}>
                      LVL {currentLevel} STRIDER
                    </Text>
                  </View>
                </View>
                <IconButton icon="menu" label="Open menu" onPress={() => navigation.openDrawer()} />
              </View>

              {/* Player Card */}
              <PlayerCard
                level={currentLevel}
                username={profile?.username || "Strider_01"}
                streak={currentStreak}
                xp={currentXP}
                gems={Number(profile?.stats?.gems || 0)}
                onPress={() => router.push("/drawer/progress")}
              />

              <TodayCard
                streak={currentStreak}
                ranToday={ranToday}
                weatherTier={weather.status === "ok" ? weather.tier : null}
                city={weather.city}
                needsCheckCount={needsCheckCount}
                onStartRun={() => router.push("/drawer/maps")}
                onOpenCalendar={() => router.push("/drawer/calendar")}
                onOpenMap={() => router.push("/drawer/maps")}
              />

              {/* Map Preview Section */}
              <Text style={dashboard_ui.sectionTitle}>Your map</Text>
              <View style={dashboard_ui.mapPreviewContainer}>
                <View
                  style={{
                    borderRadius: KARELA.radius.md,
                    overflow: "hidden",
                    height: 200,
                    width: "100%",
                    backgroundColor: KARELA.color.surface,
                  }}
                >
                  {currentLocation?.latitude ? (
                    <MapView
                      ref={mapRef}
                      // Google + ghostMapStyle on Android; Apple Maps' own dark mode on iOS
                      // (Google Maps needs extra native setup on iOS and is blank in Expo Go).
                      provider={Platform.OS === "android" ? "google" : undefined}
                      userInterfaceStyle="dark"
                      style={StyleSheet.absoluteFill}
                      customMapStyle={ghostMapStyle}
                      showsUserLocation={true}
                      tintColor={KARELA.color.brand}
                      initialRegion={{
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: KARELA.color.brand, fontFamily: KARELA.font.medium }}>
                        Finding your location...
                      </Text>
                    </View>
                  )}
                </View>

                {/* RECENTER BUTTON (Targeting User) */}
                <IconButton
                  icon="navigate"
                  label="Center the map on me"
                  tone="brand"
                  onPress={recenterMap}
                  style={{ position: "absolute", left: KARELA.space.md, top: KARELA.space.md, zIndex: 10 }}
                />

                <Image
                  source={require("@/assets/images/Sun.png")}
                  style={dashboard_ui.weatherOverlayIcon}
                />

                <Button
                  label="Open map"
                  size="sm"
                  icon="map-outline"
                  onPress={() => router.push("/drawer/maps")}
                  style={dashboard_ui.mapButton}
                />
              </View>

              {/* Character Avatars */}
              {/* CHARACTER GRID */}
              <View style={dashboard_ui.characterRow}>
                {/* ANI COLUMN */}
                <View style={dashboard_ui.characterColumn}>
                  <Text style={dashboard_ui.characterTitle}>Ani</Text>
                  <TouchableOpacity
                    style={dashboard_ui.characterBox}
                    onPress={() =>
                      setCurrentAniAction("Female_rig|female_WAVE")
                    }
                  >
                    <AniView action={currentAniAction} />
                  </TouchableOpacity>
                  {/* CUSTOMIZE BUTTON */}
                  <Button
                    label="Customize"
                    variant="secondary"
                    size="sm"
                    icon="color-palette-outline"
                    block
                    onPress={() => router.push("/homepage/CustomizeAni")}
                    style={dashboard_ui.customizeBtn}
                  />
                </View>

                {/* YOUR CHARACTER: the user's own avatar, once character creation exists */}
                <View style={dashboard_ui.characterColumn}>
                  <Text style={dashboard_ui.characterTitle}>You</Text>
                  <View style={[dashboard_ui.characterBox, dashboard_ui.characterLocked]}>
                    <MaterialCommunityIcons
                      name="account-plus-outline"
                      size={32}
                      color={KARELA.color.textMuted}
                    />
                    <Text style={dashboard_ui.characterLockedText}>Your character is coming soon</Text>
                  </View>
                </View>
              </View>
              {/* Chat with Ani */}
              <Text style={dashboard_ui.sectionTitle}>Chat with Ani</Text>
              <TouchableOpacity onPress={() => router.push("/drawer/ai_coach")}>
                <View style={dashboard_ui.chatCardContainer}>
                  <LinearGradient
                    colors={KARELA.gradients.brand}
                    style={dashboard_ui.chatSideBar}
                  />
                  <View style={dashboard_ui.chatContent}>
                    <Text style={dashboard_ui.chatText}>
                      {getWeatherLine(weather)}
                    </Text>
                    {/* Looks like a field, opens the chat (typing here used to go nowhere). */}
                    <Pressable
                      style={dashboard_ui.nestedInputContainer}
                      onPress={() => router.push("/drawer/ai_coach")}
                      accessibilityRole="button"
                      accessibilityLabel="Message Ani"
                    >
                      <Text style={[dashboard_ui.nestedInput, { color: KARELA.color.textMuted }]}>Message Ani</Text>
                      <IconButton
                        icon="arrow-forward"
                        label="Open chat with Ani"
                        tone="brand"
                        size={40}
                        onPress={() => router.push("/drawer/ai_coach")}
                      />
                    </Pressable>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Quest Progress Section */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: 10,
                }}
              >
                <Text style={[dashboard_ui.sectionTitle, { marginBottom: 0 }]}>
                  Quest Progress
                </Text>
                <Button label="View all" variant="link" size="sm" onPress={() => router.push("/drawer/quests")} />
              </View>

              <View style={{ marginBottom: 20 }}>
                {activeMissions.length > 0 ? (
                  <View>
                    {/* Active Status Badge */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: KARELA.space.xs,
                          backgroundColor: KARELA.color.brand,
                          marginRight: 6,
                        }}
                      />
                      <Text
                        style={{
                          color: KARELA.color.brand,
                          fontSize: KARELA.size.label,
                          fontFamily: KARELA.font.bold,
                        }}
                      >
                        Today&apos;s quests
                      </Text>
                    </View>

                    <QuestCard
                      overallCompletion={
                        activeMissions.reduce((acc, q) => acc + q.progress, 0) /
                        activeMissions.length
                      }
                      quests={activeMissions}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={dashboard_ui.chatCardContainer}
                    onPress={() => router.push("/drawer/quests")}
                  >
                    <View
                      style={[
                        dashboard_ui.chatContent,
                        { padding: 20, alignItems: "center" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="radar"
                        size={32}
                        color={KARELA.color.textFaint}
                      />
                      <Text
                        style={[
                          dashboard_ui.chatText,
                          { textAlign: "center", color: KARELA.color.textMuted, marginTop: 10 },
                        ]}
                      >
                        No quests yet.{"\n"}Open Quests and Ani will pick one for you.
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              {isKeyboardVisible && <View style={{ height: 100 }} />}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* 3. THE DOCK - Placed OUTSIDE the ScrollView but INSIDE the root View 
            This ensures it floats on top of the content. */}
      {!isKeyboardVisible && <DynamicDock />}
    </SafeAreaView>
    </Screen>
  );
}

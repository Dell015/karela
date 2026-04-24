import { QuestCard } from "@/components/QuestCard";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import { addDoc, doc, updateDoc } from "firebase/firestore";
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
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import MapView from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom Hooks & Styles
import AniView from "@/components/AniModel";
import { useAuth } from "@/context/AuthContext";
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { generateAniQuest } from "@/services/database/firebase/aiService";
import { db } from "@/services/database/firebase/config"; // Ensure this is imported
import { dashboard_ui } from "@/styles/dashboardStyle";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { theme } from "@/styles/theme";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

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
  const currentStreak = Number(profile?.stats?.streak || 0);
  const totalXP = 1000;
  const progressPercent =
    totalXP > 0 ? Math.min((currentXP / totalXP) * 100, 100) : 0;
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [currentAniAction, setCurrentAniAction] = useState(
    "Female_rig|female_IDLE",
  );
  const [activeMissions, setActiveMissions] = useState<any[]>([]);

  const isFocused = useIsFocused();

  console.log("DEBUG PROFILE STATS:", JSON.stringify(profile?.stats, null, 2));

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
  }>({
    temp: "--",
    desc: "Loading...",
    city: "Unknown",
    icon: "01d",
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
        });
      }
    } catch (error) {
      console.error("Weather Fetch failed:", error);
    }
  };

  useEffect(() => {
    fetchWeather("Tuguegarao");
  }, []);

  useEffect(() => {
    if (!profile?.uid) return;

    const missionsRef = collection(db, "users", profile.uid, "missions");

    // Update: Filter for Active Solo Daily missions for the main dashboard view
    const q = query(
      missionsRef,
      where("status", "==", "active"),
      where("category", "==", "solo"), // New Filter
      where("frequency", "==", "daily"), // New Filter
      limit(5),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMissions = snapshot.docs.map((doc) => {
        const data = doc.data();
        const prog =
          data.targetValue > 0 ? data.currentValue / data.targetValue : 0;

        return {
          id: doc.id,
          mission: data.title || "Unknown Mission",
          progress: Math.min(prog, 1.0),
          xp: data.xpReward || 0,
          frequency: data.frequency, // Good to keep for UI badges
        };
      });
      setActiveMissions(fetchedMissions);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  useEffect(() => {
    const triggerDailyReset = async () => {
      if (!profile?.uid || !profile?.stats) return;

      const today = new Date().toISOString().split("T")[0];
      const lastDaily = profile.stats.last_daily_reset;

      if (lastDaily !== today) {
        console.log(
          "Dashboard: New day detected. Initializing Quest Engine...",
        );
        const newQuest = await generateAniQuest(profile);

        if (newQuest) {
          await addDoc(collection(db, "users", profile.uid, "missions"), {
            title: newQuest.title,
            description: newQuest.description,
            targetValue: newQuest.goalDistance / 1000,
            currentValue: 0,
            xpReward: newQuest.rewardXP,
            status: "active",
            category: "solo",
            frequency: "daily",
            createdAt: today,
          });

          await updateDoc(doc(db, "users", profile.uid), {
            "stats.last_daily_reset": today,
          });
        }
      }
    };

    if (isFocused && profile) {
      triggerDailyReset();
    }
  }, [isFocused, profile?.uid]);

  return (
    <SafeAreaView style={[theme.container, { backgroundColor: "#0d0d0d" }]}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: "#0d0d0d" }}
            contentContainerStyle={{
              paddingBottom: isKeyboardVisible ? 20 : 160,
              backgroundColor: "#0d0d0d",
            }}
          >
            <View style={dashboard_ui.dashboard}>
              {/* Profile Header */}
              <View style={dashboard_ui.ProfileHeader}>
                <View style={dashboard_ui.LeftGroup}>
                  <TouchableOpacity
                    onPress={() => router.push("/drawer/profile")}
                  >
                    <Image
                      source={require("@/assets/images/sir-sander.jpg")}
                      style={dashboard_ui.Image}
                    />
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
                <TouchableOpacity
                  style={dashboard_ui.menuButton}
                  onPress={() => navigation.openDrawer()}
                >
                  <Ionicons name="menu" size={32} color="#7CF205" />
                </TouchableOpacity>
              </View>

              {/* Stats Card */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push("/drawer/progress")}
              >
                <LinearGradient
                  colors={["#7CF205", "#209F77"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={dashboard_ui.RunCard}
                >
                  <View style={dashboard_ui.CardOverlay}>
                    <View style={dashboard_ui.CardContent}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <View>
                          <Text style={dashboard_ui.LevelLabel}>
                            LVL {currentLevel} STRIDER
                          </Text>
                          <Text style={dashboard_ui.nameLabel}>
                            {profile?.username || "Strider_01"}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={dashboard_ui.LevelLabel}>STREAK</Text>
                          <Text style={dashboard_ui.nameLabel}>
                            {currentStreak} 🔥
                          </Text>
                        </View>
                      </View>
                      <View style={dashboard_ui.progressContainer}>
                        <View style={dashboard_ui.progressBarTrack}>
                          <View
                            style={[
                              dashboard_ui.progressBarFill,
                              { width: `${progressPercent}%` },
                            ]}
                          />
                        </View>
                        <Text style={dashboard_ui.xpText}>
                          {currentXP}/{totalXP} XP
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Map Preview Section */}
              <Text style={dashboard_ui.sectionTitle}>Active Path-Maker</Text>
              <View style={dashboard_ui.mapPreviewContainer}>
                <View
                  style={{
                    borderRadius: 15,
                    overflow: "hidden",
                    height: 200,
                    width: "100%",
                    backgroundColor: "#1a1a1a",
                  }}
                >
                  {currentLocation?.latitude ? (
                    <MapView
                      ref={mapRef}
                      provider={Platform.OS === "android" ? "google" : "google"}
                      style={StyleSheet.absoluteFillObject}
                      customMapStyle={ghostMapStyle}
                      showsUserLocation={true}
                      tintColor="#7CF205"
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
                      <Text style={{ color: "#7CF205", fontWeight: "600" }}>
                        INITIALIZING SENSORS...
                      </Text>
                    </View>
                  )}
                </View>

                {/* RECENTER BUTTON (Targeting User) */}
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 1,
                    backgroundColor: "#7CF205",
                    borderColor: "#7CF205",
                    padding: 5,
                    borderRadius: 12,
                    borderWidth: 1,
                    zIndex: 10,
                  }}
                  onPress={recenterMap}
                >
                  <Ionicons name="navigate" size={20} color="#ffffff" />
                </TouchableOpacity>

                <Image
                  source={require("@/assets/images/Sun.png")}
                  style={dashboard_ui.weatherOverlayIcon}
                />

                <TouchableOpacity
                  style={dashboard_ui.mapButton}
                  onPress={() => router.push("/drawer/maps")}
                >
                  <Text style={dashboard_ui.mapButtonText}>
                    Click to see more
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Character Avatars */}
              {/* Character Avatars */}
              <View style={dashboard_ui.characterRow}>
                <View style={dashboard_ui.characterColumn}>
                  <Text style={dashboard_ui.characterTitle}>Ani</Text>
                  <View style={dashboard_ui.characterBox}>
                    {/* THE 3D MODEL LIVES HERE */}
                    <AniView action={currentAniAction} />
                  </View>
                </View>

                <View style={dashboard_ui.characterColumn}>
                  <Text style={dashboard_ui.characterTitle}>Sander</Text>
                  <View style={dashboard_ui.characterBox}>
                    {/* You can put a different model or placeholder here later */}
                  </View>
                </View>
              </View>

              {/* Chat with Ani */}
              <Text style={dashboard_ui.sectionTitle}>Chat with Ani</Text>
              <TouchableOpacity onPress={() => router.push("/drawer/ai_coach")}>
                <View style={dashboard_ui.chatCardContainer}>
                  <LinearGradient
                    colors={["#7CF205", "#209F77"]}
                    style={dashboard_ui.chatSideBar}
                  />
                  <View style={dashboard_ui.chatContent}>
                    <Text style={dashboard_ui.chatText}>
                      My sensors see {weather.desc} in {weather.city}
                      {/* Wrap weather.temp in Number() to fix the comparison error */}
                      {Number(weather.temp) > 30
                        ? " — It's a bit hot out there, stay hydrated!"
                        : " — Conditions are optimal for a run!"}
                    </Text>
                    <View style={dashboard_ui.nestedInputContainer}>
                      <TextInput
                        placeholder="Ask Ani anything..."
                        placeholderTextColor="#8A8A8A"
                        style={dashboard_ui.nestedInput}
                        returnKeyType="send"
                      />
                      <TouchableOpacity
                        onPress={() => router.push("/drawer/ai_coach")}
                      >
                        <Text style={{ color: "#fff", fontSize: 18 }}>➔</Text>
                      </TouchableOpacity>
                    </View>
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
                <TouchableOpacity onPress={() => router.push("/drawer/quests")}>
                  <Text
                    style={{
                      color: "#7CF205",
                      fontSize: 12,
                      fontWeight: "bold",
                      marginRight: 5,
                    }}
                  >
                    VIEW ALL
                  </Text>
                </TouchableOpacity>
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
                          borderRadius: 4,
                          backgroundColor: "#7CF205",
                          marginRight: 6,
                        }}
                      />
                      <Text
                        style={{
                          color: "#7CF205",
                          fontSize: 10,
                          fontWeight: "900",
                          letterSpacing: 1,
                        }}
                      >
                        DAILY SOLO OPS ACTIVE
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
                        color="#444"
                      />
                      <Text
                        style={[
                          dashboard_ui.chatText,
                          { textAlign: "center", color: "#888", marginTop: 10 },
                        ]}
                      >
                        No active missions detected.{"\n"}Visit the Quest Board
                        to generate intel.
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

      {!isKeyboardVisible && (
        <View style={dashboard_ui.floatingButtonContainer}>
          <TouchableOpacity
            style={dashboard_ui.floatingIslandCircle}
            activeOpacity={0.8}
            onPress={() => router.push("/drawer/maps")}
          >
            <LinearGradient
              colors={["#7CF205", "#209F77"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={dashboard_ui.circularGradient}
            >
              <Ionicons
                name="play"
                size={40}
                color="#fff"
                style={{ marginLeft: 4 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

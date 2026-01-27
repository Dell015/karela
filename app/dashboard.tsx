import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import custom styles
import { dashboard_ui } from "./styles/dashboard";
import { theme } from "./styles/theme";

export default function Dashboard() {
  // --- Constant Data ---
  const currentXP = 670;
  const totalXP = 1000;
  const progressPercent = (currentXP / totalXP) * 100;

  // --- State Management ---
  const [currentCity, setCurrentCity] = useState("Locating...");
  const [weather, setWeather] = useState<{
    temp: string | number;
    desc: string;
    city: string;
    icon: string;
  }>({
    temp: "--",
    desc: "Loading...",
    city: "Unknown",
    icon: "01d", // Default sun icon code
  });

  // --- API Logic ---
  const fetchWeather = async (cityName: string) => {
    try {
      // FIXED: Removed quotes. Now it reads the actual environment variable.
      const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

      if (!API_KEY) {
        console.warn("API Key missing. Check your .env file!");
        return;
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      // Check if the API returned an error (like 401 or 404)
      if (data.cod !== 200) {
        console.error("Weather API Error:", data.message);
        setCurrentCity("Error");
        return;
      }

      // FIXED: Cleaned up the bracket nesting here
      if (data.main) {
        setWeather({
          temp: Math.round(data.main.temp),
          desc: data.weather[0].description,
          city: data.name,
          icon: data.weather[0].icon,
        });
        setCurrentCity(data.name);
      }
    } catch (error) {
      console.error("Fetch failed:", error);
      setCurrentCity("Offline");
    }
  };

  useEffect(() => {
    // Only fetch if we don't have a temperature yet to save API credits
    if (weather.temp === "--") {
      fetchWeather("Tuguegarao");
    }
  }, []);

  return (
    <SafeAreaView style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={dashboard_ui.dashboard}>
        {/* --- Header Section --- */}
        <View style={dashboard_ui.ProfileHeader}>
          <View style={dashboard_ui.LeftGroup}>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              activeOpacity={0.7}
            >
              <Image
                source={require("../assets/images/sir-sander.jpg")}
                style={dashboard_ui.Image}
              />
            </TouchableOpacity>
            <View>
              <Text style={dashboard_ui.welcomeText}>Welcome back</Text>
              <Text style={dashboard_ui.nameText}>Dzaddy Sander</Text>
            </View>
          </View>

          <View style={dashboard_ui.RightGroup}>
            <TouchableOpacity onPress={() => router.push("/ai_coach")}>
              <Image
                source={require("../assets/images/coach.png")}
                style={dashboard_ui.CoachImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Progress Card --- */}
        <TouchableOpacity
          onPress={() => router.push("/PlayerCard")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#7CF205", "#209F77"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={dashboard_ui.RunCard}
          >
            <View style={dashboard_ui.CardOverlay}>
              <View style={dashboard_ui.CardContent}>
                <View style={dashboard_ui.Streak}>
                  <Image
                    source={require("../assets/images/fire.png")}
                    style={dashboard_ui.flameImage}
                  />
                  <Text style={dashboard_ui.StreakText}>67 - Day Streak</Text>
                </View>

                <Text style={dashboard_ui.LevelText}>Level 5</Text>

                <View style={dashboard_ui.progressContainer}>
                  <View style={dashboard_ui.progressBarTrack}>
                    <LinearGradient
                      colors={["#7CF205", "#209F77"]}
                      style={[
                        dashboard_ui.progressBarFill,
                        { width: `${progressPercent}%` },
                      ]}
                    />
                  </View>
                  <Text style={dashboard_ui.xpText}>
                    {currentXP}/{totalXP} XP
                  </Text>

                  <TouchableOpacity
                    onPress={() => router.push("/Run-Record")}
                    style={dashboard_ui.runButtonContainer}
                  >
                    <LinearGradient
                      colors={["#7CF205", "#209F77"]}
                      style={dashboard_ui.runButton}
                    >
                      <Text style={dashboard_ui.runButtonText}>
                        Go for a Run
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* --- Weather Section --- */}
        <Text style={dashboard_ui.WeatherText}>Weather & Alerts</Text>

        <View style={dashboard_ui.weatherCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* DYNAMIC ICON: This now loads the icon based on the API code */}
            <Image
              source={{
                uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png`,
              }}
              style={dashboard_ui.weatherIcon}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={dashboard_ui.cityText}>{currentCity}</Text>
              <Text
                style={[
                  dashboard_ui.weatherDesc,
                  { textTransform: "capitalize" },
                ]}
              >
                {weather.desc}
              </Text>
            </View>
          </View>

          <Text style={dashboard_ui.tempText}>{weather.temp}°C</Text>
        </View>
        {/* --- AI Tip of the Day --- */}
        <Text style={dashboard_ui.sectionTitle}>Daily Tip</Text>
        <View style={dashboard_ui.tipCard}>
          <Image
            source={require("../assets/images/Lightbulb.png")}
            style={dashboard_ui.tipIcon}
            resizeMode="contain"
          />
          <Text style={dashboard_ui.tipText}>
            Remember to bring your umbrella and try not to fall for someone who
            is not and will never be for you.
          </Text>
        </View>

        {/* --- Daily Missions --- */}
        <Text style={dashboard_ui.sectionTitle}>Daily Missions</Text>
        <TouchableOpacity style={dashboard_ui.missionCard} activeOpacity={0.8}>
          <Image
            source={require("../assets/images/running.png")}
            style={dashboard_ui.missionIcon}
            resizeMode="contain"
          />

          <View style={dashboard_ui.missionInfo}>
            <Text style={dashboard_ui.missionTitle}>Run 67km</Text>
            {/* Add a tiny progress bar under the title */}
            <View
              style={{
                height: 4,
                backgroundColor: "#333",
                borderRadius: 2,
                marginTop: 5,
              }}
            >
              <View
                style={{
                  width: "31.34%",
                  height: "100%",
                  backgroundColor: "#7CF205",
                  borderRadius: 2,
                }}
              />
            </View>
            <Text style={dashboard_ui.missionSub}>+6767XP</Text>
          </View>
        </TouchableOpacity>

        {/* --- Bottom Navigation Spacing --- */}
        <View style={{ height: 100 }} />
      </View>
    </SafeAreaView>
  );
}

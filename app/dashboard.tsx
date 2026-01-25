import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";

// Import custom styles
import { theme } from "./styles/theme";
import { dashboard_ui } from "./styles/dashboard";

export default function Dashboard() {
  // --- Constant Data (Static for now) ---
  const currentXP = 670;
  const totalXP = 1000;
  const progressPercent = (currentXP / totalXP) * 100;

  // --- State Management ---
  // We define the 'weather' object shape. Note the comma after 'desc'.
  const [weather, setWeather] = useState<{
    temp: string | number;
    desc: string;
    city: string;
  }>({
    temp: "--",
    desc: "Loading...",
    city: "Unknown",
  });

  // --- API Logic ---
  const fetchWeather = async () => {
    try {
      const API_KEY = "your_key_here"; // Replace with your OpenWeatherMap key
      const city = "Tuguegarao";
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      // Update state with API results
      if (data.main) {
        setWeather({
          temp: Math.round(data.main.temp), // Rounding decimals for cleaner UI
          desc: data.weather[0].description,
          city: data.name,
        });
      }
    } catch (error) {
      console.error("The fetch failed:", error);
    }
  };

  // --- Lifecycle Hooks ---
  useEffect(() => {
    fetchWeather(); // Run fetch once when the component mounts
  }, []);

  return (
    <SafeAreaView style={theme.container}>
      {/* Hide the default Expo header */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={dashboard_ui.dashboard}>
        
        {/* --- Header Section (Profile & Coach) --- */}
        <View style={dashboard_ui.ProfileHeader}>
          <View style={dashboard_ui.LeftGroup}>
            <TouchableOpacity 
              onPress={() => router.push('/profile')} 
              activeOpacity={0.7}
            >
              <Image
                source={require("../assets/images/sir-sander.jpg")}
                style={dashboard_ui.Image}
              />
            </TouchableOpacity>
            <View>
              <Text style={dashboard_ui.welcomeText}>Welcome back</Text>
              <Text style={dashboard_ui.nameText}>Sander</Text>
            </View>
          </View>

          <View style={dashboard_ui.RightGroup}>
            <TouchableOpacity onPress={() => router.push('/ai_coach')}>
              <Image
                source={require("../assets/images/coach.png")}
                style={dashboard_ui.CoachImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Progress Card (Streak & XP) --- */}
        <TouchableOpacity
          onPress={() => router.push('/PlayerCard')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#7CF205', '#209F77']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={dashboard_ui.RunCard}
          >
            <View style={dashboard_ui.CardOverlay}>
              <View style={dashboard_ui.CardContent}>
                
                {/* Streak Info */}
                <View style={dashboard_ui.Streak}>
                  <Image 
                    source={require("../assets/images/fire.png")}
                    style={dashboard_ui.flameImage}
                  />
                  <Text style={dashboard_ui.StreakText}>67 - Day Streak</Text>
                </View>

                <Text style={dashboard_ui.LevelText}>Level 5</Text>

                {/* Progress Bar Logic */}
                <View style={dashboard_ui.progressContainer}>
                  <View style={dashboard_ui.progressBarTrack}>
                    <LinearGradient
                      colors={['#7CF205', '#209F77']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[dashboard_ui.progressBarFill, { width: `${progressPercent}%` }]}
                    />
                  </View>

                  <Text style={dashboard_ui.xpText}>
                    {currentXP}/{totalXP} XP
                  </Text>

                  {/* Call to Action Button */}
                  <TouchableOpacity 
                    onPress={() => router.push('/GoForRun')}
                    style={dashboard_ui.runButtonContainer}
                  >
                    <LinearGradient 
                      colors={['#7CF205', '#209F77']}
                      style={dashboard_ui.runButton}
                    >
                      <Text style={dashboard_ui.runButtonText}>Go for a Run</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* --- Weather & Alerts Section --- */}
        <Text style={dashboard_ui.WeatherText}>Weather & Alerts</Text>
        
        <View style={dashboard_ui.weatherCard}>
          {/* Inner Group: Icon + City/Desc */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image 
              source={require("../assets/images/Sun.png")}
              style={dashboard_ui.weatherIcon}
            />
            <View style={{ marginLeft: 10 }}> 
              <Text style={dashboard_ui.cityText}>{weather.city}</Text>
              {/* textTransform: 'capitalize' in styles is recommended here */}
              <Text style={dashboard_ui.weatherDesc}>{weather.desc}</Text>
            </View>
          </View>

          {/* Dynamic Temperature from State */}
          <Text style={dashboard_ui.tempText}>{weather.temp}°C</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
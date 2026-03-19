import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, TextInput, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView from "react-native-maps";

// Import custom styles
import { dashboard_ui } from "../../styles/dashboard";
import { theme } from "../../styles/theme";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { useLocationEngine } from "@/hooks/useLocationEngine";
import { styles as mapStyles } from "@/styles/mapStyles"; 

export default function Dashboard() {
  const mapRef = useRef<MapView>(null);
  const [activeGhostData, setActiveGhostData] = useState<any[]>([]);
  const { currentLocation } = useLocationEngine(activeGhostData);

  const currentXP = 452;
  const totalXP = 1000;
  const progressPercent = (currentXP / totalXP) * 100;

  // FIXED: Explicitly defined type to allow string (initial) and number (API result)
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

  const fetchWeather = async (cityName: string) => {
    try {
      const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
      if (!API_KEY) return;
      
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.cod === 200 && data.main) {
        setWeather({
          temp: Math.round(data.main.temp), // This number is now allowed by the type above
          desc: data.weather[0].description,
          city: data.name,
          icon: data.weather[0].icon,
        });
      }
    } catch (error) { 
      console.error("Fetch failed:", error); 
    }
  };

  useEffect(() => {
    fetchWeather("Tuguegarao");
  }, []);

  return (
    // FIXED: Added background color to SafeAreaView
    <SafeAreaView style={[theme.container, { backgroundColor: '#0d0d0d' }]}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        // FIXED: Applying background color here prevents "white flash" on bounce/overscroll
        style={{ backgroundColor: '#0d0d0d' }} 
        contentContainerStyle={{ 
            paddingBottom: 140, 
            backgroundColor: '#0d0d0d' 
        }}
      >
        <View style={dashboard_ui.dashboard}>
          {/* --- Header --- */}
          <View style={dashboard_ui.ProfileHeader}>
            <View style={dashboard_ui.LeftGroup}>
              <TouchableOpacity onPress={() => router.push("/dashboard/profile")}>
                <Image source={require("@/assets/images/sir-sander.jpg")} style={dashboard_ui.Image} />
              </TouchableOpacity>
              <View>
                <Text style={dashboard_ui.welcomeText}>Welcome back</Text>
                <Text style={dashboard_ui.nameText}>Sander</Text>
              </View>
            </View>
            <TouchableOpacity><Text style={{ color: "#fff", fontSize: 24 }}>☰</Text></TouchableOpacity>
          </View>

          {/* --- Progress Card --- */}
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient colors={["#7CF205", "#209F77"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dashboard_ui.RunCard}>
              <View style={dashboard_ui.CardOverlay}>
                <View style={dashboard_ui.CardContent}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View>
                      <Text style={dashboard_ui.LevelLabel}>LVL 12 STRIDER</Text>
                      <Text style={dashboard_ui.nameLabel}>Sander_67</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={dashboard_ui.LevelLabel}>STREAK</Text>
                      <Text style={dashboard_ui.nameLabel}>67 🔥</Text>
                    </View>
                  </View>
                  <View style={dashboard_ui.progressContainer}>
                    <View style={dashboard_ui.progressBarTrack}>
                      <View style={[dashboard_ui.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={dashboard_ui.xpText}>{currentXP}/{totalXP} XP</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* --- Active Path-Maker --- */}
          <Text style={dashboard_ui.sectionTitle}>Active Path-Maker</Text>

          <View style={dashboard_ui.mapPreviewContainer}>
            {/* FIX: We create a container that fills the parent 100% 
              and clips the map to the parent's border radius.
            */}
            <View style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: 15, 
              overflow: 'hidden',
              backgroundColor: '#1A1A1A' // Fallback color
            }}>
              <MapView
                ref={mapRef}
                style={{ flex: 1 }} // This makes the map fill the 100% width/height container
                provider="google"
                googleRenderer="LATEST"
                customMapStyle={ghostMapStyle}
                showsUserLocation={true}
                initialRegion={{
                  latitude: currentLocation?.latitude || 17.6132,
                  longitude: currentLocation?.longitude || 121.7270,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              />
            </View>

            {/* These remain absolute to the mapPreviewContainer, floating ON TOP of the map */}
            <Image source={require("@/assets/images/Sun.png")} style={dashboard_ui.weatherOverlayIcon} />

            {/* Displaying actual Temp from state */}
            <View style={{ position: 'absolute', top: 10, left: 15 }}>
               <Text style={{ color: '#fff', fontWeight: 'bold' }}>{weather.temp}°C</Text>
            </View>
            
            <TouchableOpacity style={dashboard_ui.mapButton} onPress={() => router.push("/dashboard/maps")}>
              <Text style={dashboard_ui.mapButtonText}>Click to see more</Text>
            </TouchableOpacity>
          </View>

          {/* --- Character Slots --- */}
          <View style={dashboard_ui.characterRow}>
            <View style={dashboard_ui.characterColumn}>
              <Text style={dashboard_ui.characterTitle}>Ani</Text>
              <View style={dashboard_ui.characterBox} />
            </View>
            <View style={dashboard_ui.characterColumn}>
              <Text style={dashboard_ui.characterTitle}>Sander</Text>
              <View style={dashboard_ui.characterBox} />
            </View>
          </View>

          {/* --- Active Quests --- */}
          <Text style={dashboard_ui.sectionTitle}>Active Quests</Text>
          <TouchableOpacity style={dashboard_ui.questOverviewCard} onPress={() => router.push("/dashboard/quests")}>
            <Text style={dashboard_ui.questOverviewText}>Optimize your errand circuit. View Active Quests</Text>
            <View style={dashboard_ui.questSmallBox} />
          </TouchableOpacity>

          {/* --- Chat with Ani --- */}
          <Text style={dashboard_ui.sectionTitle}>Chat with Ani</Text>
          <View style={dashboard_ui.chatCardContainer}>
            <LinearGradient colors={["#7CF205", "#209F77"]} style={dashboard_ui.chatSideBar} />
            <View style={dashboard_ui.chatContent}>
              <Text style={dashboard_ui.chatText}>
                my sensors see rain clouds rolling into Tuguegarao this afternoon—let’s knock out your errands now so we can stay dry!
              </Text>
              <View style={dashboard_ui.nestedInputContainer}>
                <TextInput placeholder="Enter a question for Ani" placeholderTextColor="#8A8A8A" style={dashboard_ui.nestedInput} />
                <TouchableOpacity><Text style={{ color: "#fff", fontSize: 18 }}>➔</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- Floating Button --- */}
      <View style={dashboard_ui.floatingButtonContainer}>
        <TouchableOpacity style={dashboard_ui.floatingIsland} activeOpacity={0.8} onPress={() => router.push("/test/test")}>
          <LinearGradient colors={["#7CF205", "#209F77"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dashboard_ui.gradientButton}>
            <Text style={dashboard_ui.mainButtonText}>Go for a Run</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
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
  View
} from "react-native";
import MapView from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocationEngine } from "@/hooks/useLocationEngine";
import { ghostMapStyle } from "@/styles/ghostMapStyle";
import { dashboard_ui } from "../../styles/dashboard";
import { theme } from "../../styles/theme";

export default function Dashboard() {
  const mapRef = useRef<MapView>(null);
  const [activeGhostData] = useState<any[]>([]);
  const { currentLocation } = useLocationEngine(activeGhostData);
  
  // State to track if keyboard is open to adjust layout
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const currentXP = 452;
  const totalXP = 1000;
  const progressPercent = (currentXP / totalXP) * 100;

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

  // Keyboard Listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

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
    } catch (error) { console.error("Fetch failed:", error); }
  };

  useEffect(() => {
    fetchWeather("Tuguegarao");
  }, []);

  return (
    <SafeAreaView style={[theme.container, { backgroundColor: '#0d0d0d' }]}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0} 
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: '#0d0d0d' }} 
            contentContainerStyle={{ 
              paddingBottom: isKeyboardVisible ? 20 : 160, 
              backgroundColor: '#0d0d0d' 
            }}
          >
            <View style={dashboard_ui.dashboard}>
              {/* Profile Header */}
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

              {/* Stats Card */}
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

              <Text style={dashboard_ui.sectionTitle}>Active Path-Maker</Text>
              <View style={dashboard_ui.mapPreviewContainer}>
                <View style={{ borderRadius: 15, overflow: 'hidden', flex: 1 }}>
                    <MapView
                      ref={mapRef}
                      style={StyleSheet.absoluteFillObject}
                      provider="google"
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
                <Image source={require("@/assets/images/Sun.png")} style={dashboard_ui.weatherOverlayIcon} />
                <TouchableOpacity style={dashboard_ui.mapButton} onPress={() => router.push("/dashboard/maps")}>
                  <Text style={dashboard_ui.mapButtonText}>Click to see more</Text>
                </TouchableOpacity>
              </View>

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

              <Text style={dashboard_ui.sectionTitle}>Chat with Ani</Text>
              <View style={dashboard_ui.chatCardContainer}>
                <LinearGradient colors={["#7CF205", "#209F77"]} style={dashboard_ui.chatSideBar} />
                <View style={dashboard_ui.chatContent}>
                  <Text style={dashboard_ui.chatText}>
                    my sensors see rain clouds rolling into {weather.city}—let’s knock out your errands now!
                  </Text>
                  <View style={dashboard_ui.nestedInputContainer}>
                    <TextInput 
                      placeholder="Ask Ani anything..." 
                      placeholderTextColor="#8A8A8A" 
                      style={dashboard_ui.nestedInput} 
                      returnKeyType="send"
                    />
                    <TouchableOpacity><Text style={{ color: "#fff", fontSize: 18 }}>➔</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <Text style={dashboard_ui.sectionTitle}>Quest Progress</Text>
              <View style={dashboard_ui.chatCardContainer}>
              </View>

              {/* DYNAMIC SPACER: Pushes the card up higher when typing */}
              {isKeyboardVisible && <View style={{ height: 100 }} />}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Hide the run button when keyboard is open for a cleaner look */}
      {!isKeyboardVisible && (
        <View style={dashboard_ui.floatingButtonContainer}>
          <TouchableOpacity style={dashboard_ui.floatingIsland} activeOpacity={0.8} onPress={() => router.push("/test/test")}>
            <LinearGradient colors={["#7CF205", "#209F77"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dashboard_ui.gradientButton}>
              <Text style={dashboard_ui.mainButtonText}>Go for a Run</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
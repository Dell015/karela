import { Ionicons } from "@expo/vector-icons"; // Built-in icon library
import { router, Stack } from "expo-router"; // Component to control the native nav bar
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "./styles/theme";
import { dashboard_ui } from "./styles/dashboard";
import { Assets } from "@react-navigation/elements";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";

// 'export default' = The main class/function of this file (Like 'public static void Main' logic)
export default function Dashboard() {
  const currentXP = 670;
  const totalXP = 1000;

  const progressPercent = (currentXP /totalXP) * 100;

  return (
    // SafeAreaView: A specialized "Box" that respects the iPhone Notch/Home Indicator
    <SafeAreaView style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={dashboard_ui.dashboard}>

        <View style={dashboard_ui.ProfileHeader}>

          <View style={dashboard_ui.LeftGroup}>
            <TouchableOpacity 
              onPress={() => { router.push('/profile'); }}
              activeOpacity={0.7 }>
                <Image
                  source={require("../assets/images/sir-sander.jpg")}
                  style={dashboard_ui.Image}/>
            </TouchableOpacity>
            <View>
              <Text style={dashboard_ui.welcomeText}>Welcome back</Text>
              <Text style={dashboard_ui.nameText}>Sander</Text>
            </View>
          </View>

          <View style={dashboard_ui.RightGroup}>
            <TouchableOpacity 
              onPress={() => { router.push('/ai_coach'); }}>
              <Image
                source={require("../assets/images/coach.png")}
                style={dashboard_ui.CoachImage}/>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => { router.push('/PlayerCard'); }}
          activeOpacity={0.9}
        >
          <LinearGradient
          colors={['#7CF205', '#209F77']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={dashboard_ui.RunCard}>
            <View style={dashboard_ui.CardOverlay}>
              <View style={dashboard_ui.CardContent}>
                <View style={dashboard_ui.Streak}>
                  <Image 
                  source={require("../assets/images/fire.png")}
                  style={dashboard_ui.flameImage}/>
                  <Text style={dashboard_ui.StreakText}>67 - Day Streak</Text>
                </View>
                <Text style={dashboard_ui.LevelText}>Level 5</Text>

                <View style={dashboard_ui.progressContainer}>
                  <View style={dashboard_ui.progressBarTrack}>

                    <LinearGradient
                      colors={['#7CF205', '#209F77']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[dashboard_ui.progressBarFill, { width: `${progressPercent}%` }]}>
                    </LinearGradient>
                  </View>

                  <Text style={dashboard_ui.xpText}>
                    {currentXP}/{totalXP} XP
                  </Text>

                  <TouchableOpacity 
                    onPress={() => {router.push('/GoForRun')}}
                    style={dashboard_ui.runButtonContainer}>
                      <LinearGradient 
                         colors={['#7CF205', '#209F77']}
                         start={{ x: 0, y: 0 }}
                         end={{ x: 1, y: 1 }}
                         style={dashboard_ui.runButton}>
                          <Text style={dashboard_ui.runButtonText}>Go for a Run</Text>
                         </LinearGradient>
                    </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={dashboard_ui.WeatherText}>Weather & Alerts</Text>
      </View>
    </SafeAreaView>
  );
}

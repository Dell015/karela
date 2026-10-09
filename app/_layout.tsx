import { AuthGate } from "@/components/AuthGate";
import { AuthProvider } from "@/context/AuthContext";
import { initDatabase } from "@/services/database/sqlite/database";
import { initGhostModelTable } from "@/services/engines/GhostModelManager";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useReducedMotion } from "react-native-reanimated";

export default function RootLayout() {
  // One rule for screen changes: fade between sections of the app, slide in
  // from the right when drilling into details (matches their Back button),
  // slide up for the run summary (a result card). None with Reduce Motion.
  const reduceMotion = useReducedMotion();
  const anim = (a: "fade" | "slide_from_right" | "slide_from_bottom") => ({
    animation: reduceMotion ? ("none" as const) : a,
  });

  // Initialize local SQLite tables once at app startup
  useEffect(() => {
    try {
      initDatabase();
      initGhostModelTable();
    } catch (e) {
      console.error("Database init failed:", e);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
              ...anim("fade"),
              animationDuration: 250,
            }}
          >
            {/* Onboarding / Landing */}
            <Stack.Screen name="index" />

            {/* Auth */}
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/signup" />

            {/* Main App (drawer) */}
            <Stack.Screen name="drawer" />

            {/* Full Screen Modes */}
            <Stack.Screen name="summary" options={anim("slide_from_bottom")} />
            <Stack.Screen name="performanceGraph" options={anim("slide_from_right")} />
            <Stack.Screen name="homepage/CustomizeAni" options={anim("slide_from_right")} />
            <Stack.Screen name="dashboard/character_creation" options={anim("slide_from_right")} />
            <Stack.Screen name="settings/privacy-zones" options={anim("slide_from_right")} />
            <Stack.Screen name="settings/your-data" options={anim("slide_from_right")} />
            <Stack.Screen name="territory-map" options={anim("slide_from_right")} />
            <Stack.Screen name="scout-pass" options={anim("slide_from_right")} />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

import { AuthProvider } from "@/context/AuthContext";
import { initDatabase } from "@/services/database/sqlite/database";
import { initGhostModelTable } from "@/services/engines/GhostModelManager";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
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
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
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
          <Stack.Screen name="summary" />
          <Stack.Screen name="homepage/active-run" />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

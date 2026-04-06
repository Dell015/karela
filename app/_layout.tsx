import { AuthProvider } from "@/context/AuthContext";
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        {/* The Root Stack handles full-screen transitions */}
        <Stack screenOptions={{ headerShown: false }}>
          {/* 1. Onboarding / Landing */}
          <Stack.Screen name="index" />
          
          {/* 2. Auth Group */}
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />

          {/* 3. The Drawer Group (Main App) */}
          <Stack.Screen name="(drawer)" />

          {/* 4. Full Screen Modes (No Drawer here) */}
          <Stack.Screen name="test/active-run" />
          <Stack.Screen name="homepage/summary" />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
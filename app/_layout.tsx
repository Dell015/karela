// app/_layout.tsx
import 'react-native-gesture-handler'; 
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerPosition: 'right',
          drawerStyle: {
            backgroundColor: "#1A1A1A",
            width: 280,
          },
          drawerActiveTintColor: "#7CF205",
          drawerInactiveTintColor: "#FFFFFF",
        }}
      >
        {/* 1. THE MAIN DASHBOARD (Your current file) */}
        <Drawer.Screen
          name="dashboard/dashboard" 
          options={{
            drawerLabel: "Home",
            drawerIcon: ({ color }: { color: string }) => (
              <Ionicons name="home-outline" size={22} color={color} />
            ),
          }}
        />

        {/* 2. THE MAPS PAGE */}
        <Drawer.Screen
          name="dashboard/maps"
          options={{
            drawerLabel: "Ghost Race",
            drawerIcon: ({ color }: { color: string }) => (
              <Ionicons name="map-outline" size={22} color={color} />
            ),
          }}
        />

        {/* 3. THE PROGRESS/XP PAGE */}
        <Drawer.Screen
          name="dashboard/progress_screen"
          options={{
            drawerLabel: "My Progress",
            drawerIcon: ({ color }: { color: string }) => (
              <Ionicons name="stats-chart-outline" size={22} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
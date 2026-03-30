// app/_layout.tsx
import { AuthProvider } from "@/context/AuthContext"; // Import this!
import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider> 
        <Drawer
          screenOptions={{
            headerShown: false,
            drawerPosition: 'right',
            drawerStyle: { backgroundColor: "#1A1A1A", width: 280 },
            drawerActiveTintColor: "#7CF205",
            drawerInactiveTintColor: "#FFFFFF",
          }}
        >
          <Drawer.Screen
            name="dashboard/dashboard" 
            options={{
              drawerLabel: "Home",
              drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
            }}
          />
          <Drawer.Screen
            name="dashboard/maps"
            options={{
              drawerLabel: "Ghost Race",
              drawerIcon: ({ color }) => <Ionicons name="map-outline" size={22} color={color} />,
            }}
          />
          <Drawer.Screen
            name="dashboard/progress_screen"
            options={{
              drawerLabel: "My Progress",
              drawerIcon: ({ color }) => <Ionicons name="stats-chart-outline" size={22} color={color} />,
            }}
          />
        </Drawer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
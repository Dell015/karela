import { AuthProvider } from "@/context/AuthContext";
import { auth } from "@/services/database/firebase/config"; // Ensure path is correct
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { signOut } from "firebase/auth";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from "react-native-gesture-handler";

/**
 * CUSTOM SIDEBAR COMPONENT
 */
function CustomDrawerContent(props: any) {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          try {
            await signOut(auth);
            // After sign out, jump back to login
            router.replace("/auth/login"); 
          } catch (error) {
            Alert.alert("Error", "Failed to log out.");
          }
        } 
      },
    ]);
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Existing Menu Items (Home, Ghost Race, etc.) */}
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>

      {/* Logout Button at the Bottom */}
      <View style={styles.logoutContainer}>
        <DrawerItem
          label="Logout"
          labelStyle={{ color: "#FF4444", fontFamily: "Excon-Bold" }}
          icon={({ size }) => <Ionicons name="log-out-outline" size={size} color="#FF4444" />}
          onPress={handleLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider> 
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />} // Hook up custom sidebar
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
          
          {/* Hide the index or auth screens from appearing in the side menu list */}
          <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="auth/login" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="auth/signup" options={{ drawerItemStyle: { display: 'none' } }} />
        </Drawer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingBottom: 20,
    marginTop: 'auto',
  },
});
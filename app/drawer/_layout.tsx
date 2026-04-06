import { auth } from "@/services/database/firebase/config";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { signOut } from "firebase/auth";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";

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
            router.replace("/auth/login");
          } catch (error) {
            Alert.alert("Error", "Failed to log out.");
          }
        },
      },
    ]);
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: 20 }}>
        <DrawerItemList {...props} />
      </View>
      <View style={styles.logoutContainer}>
        <DrawerItem
          label="Logout"
          labelStyle={{ color: "#FF4444", fontWeight: "bold" }}
          icon={({ size }) => (
            <Ionicons name="log-out-outline" size={size} color="#FF4444" />
          )}
          onPress={handleLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      key="main-drawer-v1"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerStyle: { backgroundColor: "#1A1A1A", width: 280 },
        drawerActiveTintColor: "#7CF205",
        drawerInactiveTintColor: "#FFFFFF",
        drawerLabelStyle: { fontSize: 16, fontWeight: "700" },
      }}
    >
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="dashboard"
        options={{
          drawerLabel: "Home",
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="progress"
        options={{
          drawerLabel: "My Progress",
          drawerIcon: ({ color }) => <Ionicons name="stats-chart-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="maps"
        options={{
          drawerLabel: "Ghost Race",
          drawerIcon: ({ color }) => <Ionicons name="map-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="quests"
        options={{
          drawerLabel: "Quests",
          drawerIcon: ({ color }) => <Ionicons name="trophy-outline" size={22} color={color} />,
        }}
      />

      {/* Hidden Routes */}
      <Drawer.Screen name="profile" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="ai_coach" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="calendar" options={{ drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="performanceGraph" options={{ drawerItemStyle: { display: "none" } }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  logoutContainer: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingBottom: 20 },
});
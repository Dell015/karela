import { dashboard_ui } from "@/styles/dashboardStyle";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export const DynamicDock = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Helper to highlight the active tab based on the current route
  const getTabColor = (route: string) =>
    pathname.includes(route) ? "#7CF205" : "#8A8A8A";

  return (
    <View 
      style={dashboard_ui.islandWrapper} 
      pointerEvents="box-none" // Allows touches to pass through the transparent wrapper to the map/content behind it
    >
      <View style={dashboard_ui.islandDock}>
        {/* Dashboard / Home */}
        <TouchableOpacity
          style={dashboard_ui.islandButton}
          onPress={() => router.push("/drawer/dashboard")}
        >
          <Ionicons
            name="stats-chart"
            size={22}
            color={getTabColor("dashboard")}
          />
          <Text
            style={[
              dashboard_ui.islandButtonText,
              { color: getTabColor("dashboard") },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* Guilds */}
        <TouchableOpacity
          style={dashboard_ui.islandButton}
          onPress={() => router.push("/drawer/guilds")}
        >
          <Ionicons
            name="shield-half"
            size={22}
            color={getTabColor("guilds")}
          />
          <Text
            style={[
              dashboard_ui.islandButtonText,
              { color: getTabColor("guilds") },
            ]}
          >
            Guilds
          </Text>
        </TouchableOpacity>

        {/* MAIN PLAY BUTTON - Central RPG Action */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={dashboard_ui.playButtonOuter}
          onPress={() => router.push("/drawer/maps")}
        >
          <LinearGradient
            colors={["#7CF205", "#5BB104"]}
            style={dashboard_ui.playButtonInner}
          >
            <Ionicons name="play" size={32} color="black" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Shop */}
        <TouchableOpacity
          style={dashboard_ui.islandButton}
          onPress={() => router.push("/drawer/shop")}
        >
          <Ionicons name="cart" size={22} color={getTabColor("shop")} />
          <Text
            style={[
              dashboard_ui.islandButtonText,
              { color: getTabColor("shop") },
            ]}
          >
            Shop
          </Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={dashboard_ui.islandButton}
          onPress={() => router.push("/drawer/profile")}
        >
          <Ionicons name="person" size={22} color={getTabColor("profile")} />
          <Text
            style={[
              dashboard_ui.islandButtonText,
              { color: getTabColor("profile") },
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
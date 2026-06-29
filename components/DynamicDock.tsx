import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TAB_ITEMS = [
  { route: "/drawer/dashboard", icon: "home", label: "Home" },
  { route: "/drawer/quests", icon: "trophy", label: "Quests" },
  { route: "/drawer/maps", icon: "map", label: "Run" },
  { route: "/homepage/guilds", icon: "shield-half", label: "Guilds" },
  { route: "/homepage/shop", icon: "cart", label: "Shop" },
] as const;

export const DynamicDock = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => pathname.includes(route.split("/").pop() || "");

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.dockOuter}>
        <BlurView intensity={50} tint="dark" style={styles.blur}>
          <View style={styles.dockInner}>
            {TAB_ITEMS.map((tab, idx) => {
              const active = isActive(tab.route);
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.tab}
                  onPress={() => router.push(tab.route as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={22}
                    color={active ? KARELA.color.brand : KARELA.color.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      active && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {active && <View style={styles.indicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    zIndex: 1000,
  },
  dockOuter: {
    width: "88%",
    borderRadius: KARELA.radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124,242,5,0.12)",
    // Glow shadow
    shadowColor: KARELA.color.brand,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  blur: {
    borderRadius: KARELA.radius.xl,
    overflow: "hidden",
  },
  dockInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: 64,
    paddingHorizontal: KARELA.space.sm,
    backgroundColor: "rgba(18,18,18,0.75)",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    position: "relative",
  },
  tabLabel: {
    color: KARELA.color.textMuted,
    fontSize: 9,
    fontFamily: KARELA.font.medium,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: KARELA.color.brand,
  },
  indicator: {
    position: "absolute",
    top: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: KARELA.color.brand,
  },
});

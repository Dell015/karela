import { KarelaIcon, KarelaIconName } from "@/components/icons/KarelaIcon";
import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The bottom dock. Shown on Home, Quests, Squad and Shop (all drawer
 * screens, so switching between them behaves the same way everywhere).
 * Run is the raised lime button in the middle: it opens the full-screen
 * run map, which has no dock of its own.
 *
 * Uses router.navigate (switch to the screen) instead of push (stack a new
 * copy), so Back does not walk through every tab you tapped.
 */
type IconName = keyof typeof Ionicons.glyphMap;

// Karela's own icons for Karela things; standard ones for Home and Run.
const TABS: {
  route: string;
  icon: IconName;
  iconActive: IconName;
  karela?: KarelaIconName;
  label: string;
  primary?: boolean;
}[] = [
  { route: "/drawer/dashboard", icon: "home-outline", iconActive: "home", label: "Home" },
  { route: "/drawer/quests", icon: "trophy-outline", iconActive: "trophy", karela: "medal", label: "Quests" },
  { route: "/drawer/maps", icon: "play", iconActive: "play", label: "Run", primary: true },
  { route: "/drawer/guilds", icon: "people-outline", iconActive: "people", karela: "squad", label: "Squad" },
  { route: "/drawer/shop", icon: "diamond-outline", iconActive: "diamond", karela: "gem", label: "Shop" },
];

/** Space a screen should leave at the bottom so content clears the dock. */
export const DOCK_SPACE = 120;

export const DynamicDock = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  // Get out of the way while typing.
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboardOpen) return null;

  const isActive = (route: string) => pathname === route || pathname.endsWith(route.replace("/drawer", ""));

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, KARELA.space.md) }]}
      pointerEvents="box-none"
    >
      <View style={styles.dock} accessibilityRole="tablist">
        {TABS.map((tab) => {
          const active = isActive(tab.route);
          return (
            <Pressable
              key={tab.route}
              onPress={() => !active && router.navigate(tab.route as any)}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.tab,
                pressed && (reduceMotion ? { opacity: 0.7 } : { transform: [{ scale: 0.94 }] }),
              ]}
            >
              {tab.primary ? (
                <View style={styles.runButton}>
                  <Ionicons name={tab.icon} size={24} color={KARELA.color.onBright} />
                </View>
              ) : (
                <View style={[styles.iconWell, active && styles.iconWellActive]}>
                  {tab.karela ? (
                    <KarelaIcon
                      name={tab.karela}
                      size={22}
                      color={active ? KARELA.color.brand : KARELA.color.textMuted}
                      fillOpacity={active ? 0.35 : 0}
                    />
                  ) : (
                    <Ionicons
                      name={active ? tab.iconActive : tab.icon}
                      size={22}
                      color={active ? KARELA.color.brand : KARELA.color.textMuted}
                    />
                  )}
                </View>
              )}
              <Text style={[styles.label, (active || tab.primary) && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
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
    paddingHorizontal: KARELA.space.lg,
    zIndex: 1000,
  },
  dock: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: KARELA.space.xs,
    paddingTop: KARELA.space.sm,
    paddingBottom: KARELA.space.sm,
    borderRadius: KARELA.radius.lg,
    backgroundColor: "rgba(17,24,19,0.96)", // surface at 96%: solid enough, no blur pass
    borderWidth: 1,
    borderColor: KARELA.color.line,
    // It floats over content, so a soft neutral shadow (not a coloured glow).
    ...KARELA.glow.soft,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 56,
  },
  iconWell: {
    width: 44,
    height: 32,
    borderRadius: KARELA.radius.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWellActive: { backgroundColor: "rgba(124,242,5,0.14)" }, // lime 14%
  runButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: -22, // raised above the dock
    backgroundColor: KARELA.color.brand,
    borderWidth: 3,
    borderColor: KARELA.color.bg,
    justifyContent: "center",
    alignItems: "center",
    ...KARELA.glow.brand,
  },
  label: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.medium,
    marginTop: 2,
  },
  labelActive: { color: KARELA.color.textPrimary, fontFamily: KARELA.font.bold },
});

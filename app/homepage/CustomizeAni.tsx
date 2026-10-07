import { Button, Chip, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import AniView from "@/components/AniModel";
import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

type IconName = keyof typeof Ionicons.glyphMap;

// Ani's real animation clips (assets/3d/female_final.glb).
const MOVES: { id: string; label: string; icon: IconName }[] = [
  { id: "IDLE", label: "Idle", icon: "pause" },
  { id: "WALK", label: "Walk", icon: "walk" },
  { id: "RUN", label: "Run", icon: "fitness" },
];

// Not built yet (aboutkarela.md: cosmetics come later). Shown as locked,
// never as fake items.
const LOOKS: { label: string; icon: IconName }[] = [
  { label: "Outfit", icon: "shirt-outline" },
  { label: "Hair", icon: "cut-outline" },
  { label: "Gear", icon: "headset-outline" },
  { label: "Colours", icon: "color-palette-outline" },
];

export default function CustomizeScreen() {
  const [move, setMove] = useState("IDLE");

  return (
    <Screen variant="aurora">
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
          <Text style={styles.title}>Customize Ani</Text>
          <View style={{ width: KARELA.tap }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Stage: Ani on a soft lime platform */}
          <View style={styles.stage}>
            <Svg style={styles.platform} width="100%" height={70} viewBox="0 0 300 70" preserveAspectRatio="none">
              <Defs>
                <RadialGradient id="ani-platform" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={KARELA.color.brand} stopOpacity={0.35} />
                  <Stop offset="0.6" stopColor={KARELA.color.brandDeep} stopOpacity={0.12} />
                  <Stop offset="1" stopColor={KARELA.color.brandDeep} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={150} cy={35} rx={150} ry={35} fill="url(#ani-platform)" />
            </Svg>
            <AniView action={`Female_rig|female_${move}`} />
          </View>

          <Text style={styles.sectionLabel}>Moves</Text>
          <View style={styles.moves}>
            {MOVES.map((m) => (
              <Chip
                key={m.id}
                label={m.label}
                icon={m.icon}
                selected={move === m.id}
                onPress={() => setMove(m.id)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Her look</Text>
          <Text style={styles.sectionSub}>
            Outfits, hair, gear and colours are coming soon, earned from quests and events.
          </Text>
          <View style={styles.looks}>
            {LOOKS.map((l) => (
              <View
                key={l.label}
                style={styles.lookTile}
                accessible
                accessibilityLabel={`${l.label}, coming soon`}
              >
                <Ionicons name={l.icon} size={24} color={KARELA.color.textMuted} />
                <Text style={styles.lookLabel}>{l.label}</Text>
                <View style={styles.soonTag}>
                  <Ionicons name="lock-closed" size={10} color={KARELA.color.textMuted} />
                  <Text style={styles.soonText}>Coming soon</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Done" block onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: KARELA.space.lg,
    paddingVertical: KARELA.space.sm,
  },
  title: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  scroll: { paddingHorizontal: KARELA.space.xl, paddingBottom: KARELA.space.xl },

  stage: { height: 340, marginBottom: KARELA.space.lg },
  platform: { position: "absolute", left: 0, right: 0, bottom: 18 },

  sectionLabel: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.bold,
    marginBottom: KARELA.space.sm,
  },
  sectionSub: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    lineHeight: 18,
    marginBottom: KARELA.space.md,
  },
  moves: { flexDirection: "row", gap: KARELA.space.sm, marginBottom: KARELA.space.xxl },

  looks: { flexDirection: "row", flexWrap: "wrap", gap: KARELA.space.md },
  lookTile: {
    width: "47%",
    flexGrow: 1,
    paddingVertical: KARELA.space.lg,
    alignItems: "center",
    gap: KARELA.space.xs,
    borderRadius: KARELA.radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: KARELA.color.line,
    backgroundColor: "rgba(17,24,19,0.6)", // surface at 60%
  },
  lookLabel: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.medium },
  soonTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  soonText: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium },

  footer: {
    paddingHorizontal: KARELA.space.xl,
    paddingTop: KARELA.space.md,
    paddingBottom: KARELA.space.lg,
    borderTopWidth: 1,
    borderTopColor: KARELA.color.lineSoft,
  },
});

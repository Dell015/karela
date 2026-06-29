import { KARELA } from "@/styles/designSystem";
import { getStreakTier } from "@/services/streakMultiplier";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PlayerCardProps {
  level: number;
  username: string;
  streak: number;
  xp: number;
  gems: number;
  onPress?: () => void;
}

const XP_PER_LEVEL = 1000;

/**
 * The Player Card — the hero stat surface on the dashboard.
 * Vibrant gradient frame → dark inner → high-contrast white content.
 * Pulls every value from the KARELA design system.
 */
export const PlayerCard = ({
  level,
  username,
  streak,
  xp,
  gems,
  onPress,
}: PlayerCardProps) => {
  const progress = Math.min((xp / XP_PER_LEVEL) * 100, 100);
  const tier = getStreakTier(streak);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      {/* Vibrant gradient frame */}
      <LinearGradient
        colors={KARELA.gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.frame}
      >
        {/* Dark inner surface keeps text AA-legible */}
        <View style={styles.inner}>
          {/* Top row: identity + streak */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.label}>LVL {level} STRIDER</Text>
              <Text style={styles.name}>{username}</Text>
            </View>
            <View style={styles.streakBox}>
              <Text style={styles.label}>STREAK</Text>
              <View style={styles.streakValueRow}>
                <Ionicons name="flame" size={16} color={KARELA.vibrant.techOrange} />
                <Text style={styles.streakValue}>{streak}d</Text>
              </View>
              <Text style={styles.multiplier}>×{tier.multiplier}</Text>
            </View>
          </View>

          {/* XP meter — electric pulse gradient */}
          <View style={styles.meterRow}>
            <View style={styles.track}>
              <LinearGradient
                colors={KARELA.gradients.pulse}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.xpText}>
              {xp}/{XP_PER_LEVEL} XP
            </Text>
          </View>

          {/* Footer: gems + CTA */}
          <View style={styles.footer}>
            <View style={styles.gemsPill}>
              <Ionicons name="diamond" size={13} color={KARELA.color.brand} />
              <Text style={styles.gemsText}>{gems}</Text>
              <Text style={styles.gemsLabel}>Gems</Text>
            </View>
            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>View Progress</Text>
              <Ionicons name="chevron-forward" size={14} color={KARELA.color.textMuted} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  frame: {
    borderRadius: KARELA.radius.lg,
    padding: 2, // thin gradient border
    marginBottom: KARELA.space.md,
    ...KARELA.glow.brand,
  },
  inner: {
    backgroundColor: "rgba(13,13,13,0.92)",
    borderRadius: KARELA.radius.lg - 2,
    padding: KARELA.space.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  label: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.caption,
    letterSpacing: 1,
    fontFamily: KARELA.font.medium,
  },
  name: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h1,
    fontFamily: KARELA.font.bold,
    marginTop: 2,
  },
  streakBox: { alignItems: "flex-end" },
  streakValueRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  streakValue: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.bold,
  },
  multiplier: {
    color: KARELA.color.brand,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.bold,
    marginTop: 1,
  },
  meterRow: { marginTop: KARELA.space.lg },
  track: {
    width: "100%",
    height: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 5,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 5 },
  xpText: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.caption,
    textAlign: "right",
    marginTop: 5,
    fontFamily: KARELA.font.medium,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: KARELA.space.md,
  },
  gemsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(124,242,5,0.1)",
    paddingHorizontal: KARELA.space.md,
    paddingVertical: 6,
    borderRadius: KARELA.radius.pill,
  },
  gemsText: { color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },
  gemsLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ctaText: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
});

import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { KARELA } from "@/styles/designSystem";
import { getStreakTier } from "@/services/streakMultiplier";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PlayerCardProps {
  level: number;
  /** XP inside the current level (0 to 999). */
  xp: number;
  /** Effective streak (services/streakService.getEffectiveStreak). */
  streak: number;
  /** Has a streak but hasn't run (or been protected) today. */
  streakAtRisk?: boolean;
  gems: number;
  /** Streak Freezes held (Shop). */
  freezes: number;
  onPress?: () => void;
}

const XP_PER_LEVEL = 1000; // COMPUTATIONS.md

/**
 * Never tells the user to run: in a storm the app must not (Bayanihan rule).
 * TodayCard, which knows the weather, gives that advice.
 *
 * The Player Card on Home: level and XP to the next one, the streak and its
 * XP multiplier, Gems and Streak Freezes. Tapping it opens Progress.
 * The name is in the header right above it, so it isn't repeated here.
 */
export const PlayerCard = ({ level, xp, streak, streakAtRisk, gems, freezes, onPress }: PlayerCardProps) => {
  // XP can briefly read 1000+ before the level-up lands; never show more than a full bar.
  const levelXP = Math.min(Math.max(0, xp), XP_PER_LEVEL);
  const toNext = XP_PER_LEVEL - levelXP;
  const progress = (levelXP / XP_PER_LEVEL) * 100;
  const tier = getStreakTier(streak);
  const streakColor = streak === 0 ? KARELA.color.textFaint : streakAtRisk ? KARELA.color.civic : KARELA.vibrant.techOrange;

  const a11y = [
    `Level ${level}, ${toNext.toLocaleString()} XP to level ${level + 1}`,
    `${streak}-day streak${streak > 0 ? `, ${tier.multiplier}x XP` : ""}${streakAtRisk ? ", at risk today" : ""}`,
    `${gems.toLocaleString()} Gems`,
    `${freezes} Streak ${freezes === 1 ? "Freeze" : "Freezes"}`,
  ].join(". ");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint="Opens your progress"
      style={({ pressed }) => pressed && { opacity: 0.9 }}
    >
      {/* Thin Karela-gradient border */}
      <LinearGradient colors={KARELA.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.frame}>
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Level</Text>
              <Text style={styles.level}>{level}</Text>
            </View>
            <View style={styles.streakBox}>
              <Text style={styles.label}>Streak</Text>
              <View style={styles.streakValueRow}>
                <KarelaIcon name="streak" size={20} color={streakColor} />
                <Text style={styles.streakValue}>
                  {streak} {streak === 1 ? "day" : "days"}
                </Text>
              </View>
              <Text style={[styles.multiplier, streakAtRisk && { color: KARELA.color.civic }]}>
                {streakAtRisk ? "At risk today" : `${tier.multiplier}x XP`}
              </Text>
            </View>
          </View>

          <View style={styles.meterRow}>
            <View style={styles.track}>
              <LinearGradient
                colors={KARELA.gradients.pulse}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${progress}%` }]}
              />
            </View>
            <View style={styles.meterLabels}>
              <Text style={styles.meterText}>
                {levelXP.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP
              </Text>
              <Text style={styles.meterText}>
                {toNext.toLocaleString()} to level {level + 1}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.pills}>
              <View style={styles.pill}>
                <KarelaIcon name="gem" size={15} color={KARELA.vibrant.sky} />
                <Text style={styles.pillValue}>{gems.toLocaleString()}</Text>
                <Text style={styles.pillLabel}>Gems</Text>
              </View>
              <View style={styles.pill}>
                <KarelaIcon name="freeze" size={15} color={KARELA.vibrant.neonTeal} />
                <Text style={styles.pillValue}>{freezes}</Text>
                <Text style={styles.pillLabel}>{freezes === 1 ? "Freeze" : "Freezes"}</Text>
              </View>
            </View>
            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Progress</Text>
              <Ionicons name="chevron-forward" size={14} color={KARELA.color.textMuted} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  frame: {
    borderRadius: KARELA.radius.lg,
    padding: 2,
    marginBottom: KARELA.space.md,
  },
  inner: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg - 2,
    padding: KARELA.space.lg,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  label: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  level: { color: KARELA.color.textPrimary, fontSize: KARELA.size.display, fontFamily: KARELA.font.black, marginTop: 2 },
  streakBox: { alignItems: "flex-end" },
  streakValueRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  streakValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  multiplier: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold, marginTop: 2 },
  meterRow: { marginTop: KARELA.space.lg },
  track: { width: "100%", height: 10, backgroundColor: KARELA.color.surfaceSoft, borderRadius: 5, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5 },
  meterLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  meterText: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: KARELA.space.md, gap: KARELA.space.sm },
  pills: { flexDirection: "row", gap: KARELA.space.sm, flexShrink: 1, flexWrap: "wrap" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: KARELA.color.surfaceAlt,
    paddingHorizontal: KARELA.space.md,
    minHeight: 32,
    borderRadius: KARELA.radius.pill,
  },
  pillValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },
  pillLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 32 },
  ctaText: { color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
});

import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, {
  Defs,
  Path,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";

const STROKE_WIDTH = 20;

interface IndividualQuest {
  id: string;
  mission: string;
  progress: number; // 0 to 1
  xp: number;
}

interface QuestCardProps {
  overallCompletion: number; // e.g., 0.7 for 70%
  quests: IndividualQuest[];
}

// 1. HELPER: Draws the semi-circle gauge background and filled path
const SemiCircleGauge = ({
  percentage,
  size,
}: {
  percentage: number;
  size: number;
}) => {
  const strokeWidth = STROKE_WIDTH;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // SVG Path for a half circle starting from left
  const pathData = `
    M ${cx - radius}, ${cy}
    A ${radius}, ${radius} 0 0, 1 ${cx + radius}, ${cy}
  `;

  const arcLength = Math.PI * radius;
  const strokeDashoffset = arcLength - percentage * arcLength;

  return (
    <Svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2}`}>
      <Defs>
        <SvgGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={KARELA.color.brandDeep} stopOpacity="1" />
          <Stop offset="100%" stopColor={KARELA.color.brand} stopOpacity="1" />
        </SvgGradient>
      </Defs>
      {/* Background Track */}
      <Path
        d={pathData}
        fill="none"
        stroke={KARELA.color.surfaceSoft}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Progress Fill */}
      <Path
        d={pathData}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${arcLength}, ${arcLength}`}
        strokeDashoffset={strokeDashoffset}
      />
    </Svg>
  );
};

// Status word derived from completion (keeps copy lively)
const statusFor = (pct: number) => {
  if (pct >= 0.9) return "Elite";
  if (pct >= 0.6) return "Excellent";
  if (pct >= 0.3) return "On Track";
  return "Warming Up";
};

// 2. MAIN COMPONENT
export const QuestCard = ({ overallCompletion, quests }: QuestCardProps) => {
  const completionText = `${Math.round(overallCompletion * 100)}%`;

  return (
    <View style={styles.container}>
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButtonContainer}
          onPress={() => router.push("/drawer/quests")}
        >
          <LinearGradient
            colors={KARELA.gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            <Ionicons
              name="arrow-up-outline"
              size={18}
              color={KARELA.color.onBright}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* OVERALL GAUGE SECTION */}
      <View style={styles.gaugeSection}>
        <View style={styles.gaugeWrapper}>
          <SemiCircleGauge percentage={overallCompletion} size={200} />
          <View style={styles.gaugeTextOverlay}>
            <Text style={styles.statusText}>{statusFor(overallCompletion)}</Text>
            <Text style={styles.percentageText}>{completionText}</Text>
            <Text style={styles.subText}>tasks completed this week</Text>
          </View>
        </View>
      </View>

      {/* ACTIVE QUESTS LIST */}
      <View style={styles.questsListSection}>
        <Text style={styles.sectionTitle}>Active Quests</Text>

        {quests.map((quest) => (
          <View key={quest.id} style={styles.questRow}>
            {/* Title */}
            <Text style={styles.questMissionText} numberOfLines={1}>
              {quest.mission}
            </Text>

            {/* Horizontal Progress Bar */}
            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={KARELA.gradients.energy}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(quest.progress * 100, 100)}%` },
                ]}
              />
            </View>

            {/* XP Value */}
            <Text style={styles.questXpText}>{quest.xp}xp</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.xl,
    padding: KARELA.space.xxl,
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: KARELA.space.xl,
  },
  gaugeSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: KARELA.space.xxl,
    height: 120,
  },
  gaugeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gaugeTextOverlay: {
    position: "absolute",
    top: STROKE_WIDTH + 10,
    alignItems: "center",
  },
  statusText: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
  },
  percentageText: {
    color: KARELA.color.textPrimary,
    fontSize: 36,
    fontFamily: KARELA.font.black,
    marginVertical: -2,
  },
  subText: {
    color: KARELA.color.textSecondary,
    fontSize: 8,
    fontFamily: KARELA.font.thin,
  },
  questsListSection: {
    marginTop: KARELA.space.md,
  },
  sectionTitle: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.bold,
    marginBottom: KARELA.space.lg,
  },
  questRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: KARELA.space.md,
    backgroundColor: KARELA.color.surfaceAlt,
    paddingVertical: KARELA.space.md,
    paddingHorizontal: KARELA.space.lg,
    borderRadius: KARELA.radius.md,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  questMissionText: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.bold,
    flex: 2,
  },
  progressBarTrack: {
    flex: 3,
    height: 12,
    backgroundColor: KARELA.color.surfaceSoft,
    borderRadius: 6,
    marginHorizontal: KARELA.space.lg,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  questXpText: {
    color: KARELA.color.brand,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.bold,
    width: 45,
    textAlign: "right",
  },
  iconButtonContainer: {
    borderRadius: KARELA.radius.sm,
    overflow: "hidden",
    alignSelf: "flex-end",
  },
  gradientBackground: {
    padding: 10,
    borderRadius: KARELA.radius.sm,
    justifyContent: "center",
    alignItems: "center",
    ...KARELA.glow.brand,
  },
});

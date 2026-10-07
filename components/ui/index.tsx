import { KARELA } from "@/styles/designSystem";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

import { IconButton } from "./Button";

export { Screen } from "./Screen";

/* Buttons: one family for the whole app. See ./Button.tsx. */
export { Button, Chip, IconButton } from "./Button";

/* ============================================================
   CARD — standard elevated surface
   ============================================================ */
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** thin gradient left accent bar (like the dashboard Ani card) */
  accent?: boolean;
}

export const Card = ({ children, style, accent }: CardProps) => {
  if (accent) {
    return (
      <View style={[ui.card, ui.cardRow, style]}>
        <LinearGradient colors={KARELA.gradient} style={ui.cardAccent} />
        <View style={ui.cardAccentBody}>{children}</View>
      </View>
    );
  }
  return <View style={[ui.card, style]}>{children}</View>;
};

/* ============================================================
   SCREEN HEADER — consistent top bar with back + title
   ============================================================ */
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  right,
}: ScreenHeaderProps) => (
  <View style={ui.header}>
    {onBack ? (
      <IconButton icon="chevron-back" label="Back" onPress={onBack} style={ui.headerBack} />
    ) : (
      <View style={{ width: KARELA.tap }} />
    )}
    <View style={ui.headerCenter}>
      <Text style={ui.headerTitle}>{title}</Text>
      {subtitle && <Text style={ui.headerSubtitle}>{subtitle}</Text>}
    </View>
    <View style={ui.headerRight}>{right}</View>
  </View>
);

/* ============================================================
   SECTION TITLE
   ============================================================ */
export const SectionTitle = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) => <Text style={[ui.sectionTitle, style]}>{children}</Text>;

const ui = StyleSheet.create({
  // Card
  card: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg,
    padding: KARELA.space.xl,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  cardRow: { flexDirection: "row", padding: 0, overflow: "hidden" },
  cardAccent: { width: 6, height: "100%" },
  cardAccentBody: { flex: 1, padding: KARELA.space.xl },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: KARELA.space.xl,
    paddingTop: 60,
    paddingBottom: KARELA.space.lg,
  },
  headerBack: { marginLeft: -4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h1,
    fontFamily: KARELA.font.bold,
  },
  headerSubtitle: {
    color: KARELA.color.brand,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.medium,
    marginTop: 2,
  },
  headerRight: { width: KARELA.tap, alignItems: "flex-end" },

  // Section title
  sectionTitle: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.bold,
    marginBottom: KARELA.space.md,
  },
});

import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

export { Screen } from "./Screen";

/* ============================================================
   GRADIENT BUTTON — primary CTA in the Karela language
   ============================================================ */
interface GradientButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const GradientButton = ({
  label,
  onPress,
  loading,
  disabled,
  icon,
  style,
}: GradientButtonProps) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled || loading}
    style={[ui.btnWrap, (disabled || loading) && { opacity: 0.6 }, style]}
  >
    <LinearGradient
      colors={KARELA.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={ui.btnGradient}
    >
      {loading ? (
        <ActivityIndicator color="#04210A" />
      ) : (
        <View style={ui.btnInner}>
          {icon && <Ionicons name={icon} size={18} color="#04210A" />}
          <Text style={ui.btnText}>{label}</Text>
        </View>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

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
      <TouchableOpacity onPress={onBack} style={ui.headerBack}>
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </TouchableOpacity>
    ) : (
      <View style={ui.headerBack} />
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
  // Gradient button
  btnWrap: { borderRadius: KARELA.radius.xl, overflow: "hidden" },
  btnGradient: {
    paddingVertical: KARELA.space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: KARELA.space.sm },
  btnText: {
    color: "#04210A",
    fontSize: 16,
    fontFamily: KARELA.font.bold,
  },

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
  headerBack: { width: 40, alignItems: "flex-start" },
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
  headerRight: { width: 40, alignItems: "flex-end" },

  // Section title
  sectionTitle: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.bold,
    marginBottom: KARELA.space.md,
  },
});

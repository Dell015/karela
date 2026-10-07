import { KARELA } from "@/styles/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";

/**
 * Karela buttons. One family for the whole app, modelled on the landing
 * page (website-v2/css/base.css .btn--primary / --ink / --outline):
 *
 *   primary    lime -> teal gradient pill, dark ink    main action on a screen
 *   civic      orange pill, dark ink                   reporting, "still there"
 *   danger     coral pill, dark ink                    stop, destructive
 *   secondary  dark surface, thin light edge           cancel, second choice
 *   link       lime text, no box                       "view details", "open map"
 *
 * Every variant is at least KARELA.tap (48) tall or gets hitSlop to 48,
 * uses Excon by font name (never fontWeight), and presses down slightly:
 * motion that answers a tap. With reduce motion on, it dims instead.
 */

type Variant = "primary" | "civic" | "danger" | "secondary" | "link";
type Size = "md" | "sm";
type IconName = keyof typeof Ionicons.glyphMap;

const FILL: Record<Exclude<Variant, "secondary" | "link">, readonly [string, string]> = {
  primary: KARELA.gradient,
  civic: [KARELA.color.civic, KARELA.color.civic],
  danger: [KARELA.color.danger, KARELA.color.danger],
};

const INK: Record<Variant, string> = {
  primary: KARELA.color.onBright,
  civic: KARELA.color.onBright,
  danger: KARELA.color.onBright,
  secondary: KARELA.color.textPrimary,
  link: KARELA.color.brand,
};

const HEIGHT: Record<Size, number> = { md: 52, sm: 40 };

/** Press feedback shared by every pressable in this file. */
const usePressStyle = () => {
  const reduceMotion = useReducedMotion();
  return (pressed: boolean): ViewStyle =>
    pressed ? (reduceMotion ? { opacity: 0.7 } : { transform: [{ scale: 0.97 }], opacity: 0.9 }) : {};
};

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  /** Stretch to the container's width. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Replace the label with custom content (e.g. an animated label). */
  children?: React.ReactNode;
}

export const Button = ({
  label,
  variant = "primary",
  size = "md",
  icon,
  loading,
  block,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) => {
  const pressStyle = usePressStyle();
  const ink = INK[variant];
  const isLink = variant === "link";
  const isOff = disabled || loading;
  const h = HEIGHT[size];
  const slop = Math.max(0, (KARELA.tap - h) / 2);

  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={ink} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === "sm" ? 16 : 18} color={ink} />}
          {children ?? (
            <Text
              style={[styles.label, size === "sm" && styles.labelSm, { color: ink }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isOff, busy: !!loading }}
      disabled={isOff}
      hitSlop={isLink ? 12 : slop}
      style={({ pressed }) => [
        block ? styles.block : styles.hug,
        isOff && styles.off,
        pressStyle(pressed),
        style,
      ]}
      {...rest}
    >
      {isLink ? (
        <View style={[styles.link, { minHeight: 32 }]}>{content}</View>
      ) : variant === "secondary" ? (
        <View style={[styles.box, styles.secondary, { height: h }]}>{content}</View>
      ) : (
        <LinearGradient
          colors={FILL[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.box, { height: h }, variant === "civic" && styles.civicEdge]}
        >
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
};

/* ------------------------------------------------------------------ */

interface IconButtonProps extends Omit<PressableProps, "children" | "style"> {
  icon: IconName;
  /** Required: what the button does, for screen readers. */
  label: string;
  /** surface: glassy dark circle; brand: lime circle; plain: icon only. */
  tone?: "surface" | "brand" | "plain";
  iconColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const IconButton = ({
  icon,
  label,
  tone = "surface",
  iconColor,
  size = KARELA.tap,
  style,
  ...rest
}: IconButtonProps) => {
  const pressStyle = usePressStyle();
  const color =
    iconColor ?? (tone === "brand" ? KARELA.color.onBright : KARELA.color.textPrimary);
  const slop = Math.max(0, (KARELA.tap - size) / 2);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={slop}
      style={({ pressed }) => [
        styles.iconBtn,
        { width: size, height: size, borderRadius: size / 2 },
        tone === "surface" && styles.iconSurface,
        tone === "brand" && styles.iconBrand,
        pressStyle(pressed),
        style,
      ]}
      {...rest}
    >
      <Ionicons name={icon} size={Math.round(size * 0.46)} color={color} />
    </Pressable>
  );
};

/* ------------------------------------------------------------------ */

interface ChipProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  selected?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/** Selectable pill, like the category chips on the site's report screen. */
export const Chip = ({ label, selected, icon, style, ...rest }: ChipProps) => {
  const pressStyle = usePressStyle();
  const ink = selected ? KARELA.color.onBright : KARELA.color.textSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipOn,
        pressStyle(pressed),
        style,
      ]}
      {...rest}
    >
      {icon && <Ionicons name={icon} size={14} color={selected ? ink : KARELA.color.brand} />}
      <Text style={[styles.chipText, { color: ink }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  hug: { alignSelf: "flex-start" },
  block: { alignSelf: "stretch" },
  off: { opacity: 0.5 },
  box: {
    borderRadius: KARELA.radius.pill,
    paddingHorizontal: KARELA.space.xxl,
    justifyContent: "center",
    alignItems: "center",
  },
  secondary: {
    backgroundColor: KARELA.color.surfaceAlt,
    borderWidth: 1,
    borderColor: KARELA.color.line,
  },
  // thin gold edge so the orange reads on bright map tiles
  civicEdge: { borderWidth: 1, borderColor: "rgba(255,214,10,0.45)" },
  link: { justifyContent: "center" },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: KARELA.space.sm,
  },
  label: {
    fontFamily: KARELA.font.bold,
    fontSize: 16,
  },
  labelSm: { fontSize: 14 },

  iconBtn: { justifyContent: "center", alignItems: "center" },
  iconSurface: {
    backgroundColor: "rgba(17,24,19,0.86)", // surface at 86%: readable over maps
    borderWidth: 1,
    borderColor: KARELA.color.line,
  },
  iconBrand: { backgroundColor: KARELA.color.brand },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.xs + 2,
    minHeight: 40,
    paddingHorizontal: KARELA.space.lg,
    borderRadius: KARELA.radius.pill,
    borderWidth: 1,
    borderColor: KARELA.color.line,
    backgroundColor: KARELA.color.surface,
  },
  chipOn: { backgroundColor: KARELA.color.brand, borderColor: KARELA.color.brand },
  chipText: { fontFamily: KARELA.font.medium, fontSize: 14 },
});

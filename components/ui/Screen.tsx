import { GlowVariant, KARELA } from "@/styles/designSystem";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View, ViewStyle } from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

interface ScreenProps {
  children: React.ReactNode;
  /** Ambient glow palette to use. Each screen/section can set its own mood. */
  variant?: GlowVariant;
  /** Toggle the ambient glow orbs entirely (still keeps the dark base). */
  glow?: boolean;
  /** Slightly randomize orb placement per mount for an organic, living feel. */
  randomize?: boolean;
  style?: ViewStyle;
}

/**
 * Dynamic Karela background.
 *
 * Renders the deep dark base, then 2–3 luminous, blurred gradient
 * "orbs" (color set chosen by `variant`) behind a heavy dark blur.
 * This produces a vibrant-yet-readable aurora glow rather than a
 * bright background — white text stays AA-legible on top.
 *
 * Usage:
 *   <Screen variant="energy">...</Screen>
 *   <Screen variant="civic" randomize>...</Screen>
 *   <Screen glow={false}>...</Screen>   // flat dark
 */
export const Screen = ({
  children,
  variant = "default",
  glow = true,
  randomize = false,
  style,
}: ScreenProps) => {
  const colors = KARELA.glowSets[variant];

  // Stable per-mount jitter so orbs feel organic but don't flicker on re-render
  const jitter = useMemo(() => {
    if (!randomize) return { ox1: 0, oy1: 0, ox2: 0, oy2: 0 };
    const r = (n: number) => (Math.random() - 0.5) * n;
    return { ox1: r(120), oy1: r(120), ox2: r(120), oy2: r(120) };
  }, [randomize]);

  return (
    <View style={[styles.base, style]}>
      {glow && (
        <View style={styles.glowContainer} pointerEvents="none">
          {/* Orb 1 — top-right, primary accent */}
          <LinearGradient
            colors={[colors[0], "transparent"] as any}
            style={[
              styles.orb,
              {
                width: SW * 1.2,
                height: SW * 1.2,
                top: -SW * 0.3 + jitter.oy1,
                right: -SW * 0.4 + jitter.ox1,
                opacity: 0.85,
              },
            ]}
          />
          {/* Orb 2 — mid-left, secondary accent */}
          <LinearGradient
            colors={[colors[1], "transparent"] as any}
            style={[
              styles.orb,
              {
                width: SW * 1.0,
                height: SW * 1.0,
                top: SH * 0.3 + jitter.oy2,
                left: -SW * 0.35 + jitter.ox2,
                opacity: 0.7,
              },
            ]}
          />
          {/* Orb 3 — bottom accent (only for 3-color sets like aurora) */}
          {colors.length > 2 && (
            <LinearGradient
              colors={[colors[2], "transparent"] as any}
              style={[
                styles.orb,
                {
                  width: SW * 0.9,
                  height: SW * 0.9,
                  bottom: -SW * 0.2,
                  right: -SW * 0.1,
                  opacity: 0.6,
                },
              ]}
            />
          )}
          {/* Lighter blur — lets more color through */}
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          {/* Thinner veil — just enough for text legibility */}
          <View style={styles.veil} />
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: KARELA.color.bg,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: KARELA.color.bgGlow,
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13,13,13,0.25)",
  },
});

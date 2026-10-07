import { GlowVariant, KARELA } from "@/styles/designSystem";
import { useIsFocused, useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

interface ScreenProps {
  children: React.ReactNode;
  /** Glow palette, like data-palette on the site's sections. */
  variant?: GlowVariant;
  /** Turn the glow off and keep only the dark base. */
  glow?: boolean;
  /** Nudge the blobs a little per mount so screens don't look stamped. */
  randomize?: boolean;
  style?: ViewStyle;
}

/**
 * The Karela background, matching the landing page (website-v2/css/base.css
 * ".bg__blob"): a green-black base with three large, soft radial blobs of
 * colour. Same sizes and positions as the site; strengths about half the
 * site's (34/30/13%), because a phone screen is mostly blob:
 *   blob 1: 120vmax, top-right,    18%
 *   blob 2: 110vmax, bottom-left,  16%
 *   blob 3:  80vmax, middle,        7%
 *
 * Drawn as SVG radial gradients, so there is no blur pass: cheap on
 * low-end Android, and static (no motion to reduce).
 * The site's film grain is not reproduced: react-native-svg has no
 * feTurbulence filter.
 *
 * Children should have a transparent background so the glow shows.
 */
export const Screen = ({
  children,
  variant = "default",
  glow = true,
  randomize = false,
  style,
}: ScreenProps) => {
  const { width: W, height: H } = useWindowDimensions();

  // Screen-change transition. Drawer screens switch instantly (the drawer
  // navigator has no scene animation), so the content fades and rises 6px
  // over the still background, like the site's sections over one fixed
  // background. Stack screens already slide natively, so they skip this.
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  let inDrawer = false;
  try {
    inDrawer = navigation.getState()?.type === "drawer";
  } catch {
    inDrawer = false;
  }
  const enter = useSharedValue(1);
  useEffect(() => {
    if (!inDrawer || reduceMotion || !isFocused) return;
    enter.value = 0;
    enter.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [isFocused, inDrawer, reduceMotion, enter]);
  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 6 }],
  }));
  const [c1, c2, c3] = KARELA.glowSets[variant];

  // Stable per mount, so the glow never flickers on re-render.
  const jitter = useMemo(() => {
    const r = () => (randomize ? (Math.random() - 0.5) * 0.08 : 0);
    return [r(), r(), r(), r()];
  }, [randomize]);

  const M = Math.max(W, H); // 1vmax = M / 100
  const blobs = [
    // centre x, centre y, radius, colour, strength (CSS closest-side gradient)
    { cx: W - 0.02 * M + jitter[0] * M, cy: -0.02 * M, r: 0.6 * M, color: c1, a: 0.18 },
    { cx: -0.05 * M, cy: H + jitter[1] * M, r: 0.55 * M, color: c2, a: 0.16 },
    { cx: 0.32 * W + 0.4 * M + jitter[2] * M, cy: 0.28 * H + 0.4 * M + jitter[3] * M, r: 0.4 * M, color: c3, a: 0.07 },
  ];

  return (
    <View style={[styles.base, style]}>
      {glow && (
        <Svg
          width={W}
          height={H}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Defs>
            {blobs.map((b, i) => (
              <RadialGradient key={i} id={`karela-blob-${i}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={b.color} stopOpacity={b.a} />
                <Stop offset="1" stopColor={b.color} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          {blobs.map((b, i) => (
            <Circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={`url(#karela-blob-${i})`} />
          ))}
        </Svg>
      )}
      <Animated.View style={[styles.content, enterStyle]}>{children}</Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1 },
  base: {
    flex: 1,
    backgroundColor: KARELA.color.bg,
  },
});

import { KARELA } from "@/styles/designSystem";
import * as Location from "expo-location";
import { memo, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Defs, Path, RadialGradient, Stop } from "react-native-svg";

/**
 * "You are here": a dot with an arrow showing which way the phone faces.
 *
 * - Heading comes from the phone's own fused compass (watchHeadingAsync),
 *   steadier than the raw magnetometer.
 * - The arrow eases toward each new heading, always the short way round,
 *   so it turns smoothly instead of jumping.
 * - Only this marker re-renders as it turns, not the whole run screen.
 *
 * Android (Google Maps): the marker is flat and uses the native `rotation`
 * prop, so it turns with the map. iPhone (Apple Maps) has no marker rotation,
 * so the view itself rotates, minus the map's own rotation (`mapHeading`).
 */

const IS_ANDROID = Platform.OS === "android";
const SIZE = 96; // room for the beam; the dot sits in the centre
const C = SIZE / 2;
const BEAM_R = 46; // beam length from the centre
const BEAM_HALF = 34; // half the beam's width, in degrees

/** Point at `deg` (0 = up, clockwise) and distance r from the centre. */
const at = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return `${(C + r * Math.sin(rad)).toFixed(2)},${(C - r * Math.cos(rad)).toFixed(2)}`;
};
// A wedge with a curved outer edge, pointing up.
const BEAM_PATH = `M${C},${C} L${at(-BEAM_HALF, BEAM_R)} A${BEAM_R},${BEAM_R} 0 0 1 ${at(BEAM_HALF, BEAM_R)} Z`;
// A notched arrowhead just ahead of the dot.
const ARROW_PATH = `M${C},${C - 26} L${C + 6.5},${C - 15} L${C},${C - 18} L${C - 6.5},${C - 15} Z`;

/** Signed shortest turn from a to b, in degrees (-180..180). */
const turn = (a: number, b: number) => ((b - a + 540) % 360) - 180;

export const UserMarker = memo(function UserMarker({
  coordinate,
  mapHeading = 0,
}: {
  coordinate: { latitude: number; longitude: number };
  /** the map's rotation in degrees (needed on iPhone only) */
  mapHeading?: number;
}) {
  const [angle, setAngle] = useState(0);
  const [hasHeading, setHasHeading] = useState(false);
  const target = useRef(0);
  const shown = useRef(0);
  const frame = useRef<number | null>(null);
  // Android snapshots custom marker views; let it draw once, then freeze.
  const [track, setTrack] = useState(true);

  // Redraw when the arrow first appears (the compass can report late), then freeze.
  useEffect(() => {
    setTrack(true);
    const t = setTimeout(() => setTrack(false), 600);
    return () => clearTimeout(t);
  }, [hasHeading]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let alive = true;

    const animate = () => {
      const d = turn(shown.current, target.current);
      if (Math.abs(d) < 0.5) {
        shown.current = target.current;
        setAngle(Math.round(shown.current));
        frame.current = null;
        return;
      }
      // Ease: cover a fifth of the remaining turn each frame (about 60 fps).
      shown.current = (shown.current + d * 0.2 + 360) % 360;
      setAngle((prev) => {
        const next = Math.round(shown.current);
        return next === prev ? prev : next;
      });
      frame.current = requestAnimationFrame(animate);
    };

    Location.watchHeadingAsync((h) => {
      const v = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      if (!Number.isFinite(v) || v < 0) return;
      if (Math.abs(turn(target.current, v)) < 1) return; // ignore tiny wobble
      target.current = v;
      setHasHeading(true);
      if (frame.current === null) frame.current = requestAnimationFrame(animate);
    })
      .then((s) => {
        if (alive) sub = s;
        else s.remove();
      })
      .catch(() => {
        // No compass on this device: the dot shows without an arrow.
      });

    return () => {
      alive = false;
      sub?.remove();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const viewRotation = IS_ANDROID ? 0 : angle - mapHeading;

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={IS_ANDROID ? angle : undefined}
      tracksViewChanges={track}
      zIndex={999}
    >
      <View style={[s.box, { transform: [{ rotate: `${viewRotation}deg` }] }]} accessibilityLabel="Your location">
        {hasHeading && (
          <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              {/* Lime at the dot, fading to nothing at the edge */}
              <RadialGradient id="beam" cx={C} cy={C} r={BEAM_R} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={KARELA.color.brand} stopOpacity={0.6} />
                <Stop offset="0.6" stopColor={KARELA.color.brand} stopOpacity={0.3} />
                <Stop offset="1" stopColor={KARELA.color.brand} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Path d={BEAM_PATH} fill="url(#beam)" />
            <Path d={ARROW_PATH} fill={KARELA.color.textPrimary} stroke={KARELA.color.bg} strokeWidth={1} strokeLinejoin="round" />
          </Svg>
        )}
        <View style={s.dot} />
      </View>
    </Marker>
  );
});

const s = StyleSheet.create({
  box: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: KARELA.color.brand,
    borderWidth: 3,
    borderColor: KARELA.color.textPrimary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 5,
  },
});

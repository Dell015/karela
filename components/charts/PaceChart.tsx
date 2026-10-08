import { formatPace, PacePoint, shortDate } from "@/services/runAnalytics";
import { KARELA } from "@/styles/designSystem";
import { useState } from "react";
import { GestureResponderEvent, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

/**
 * Pace per run, oldest to newest. Faster is higher, so "up" means
 * improving, which is how people read a progress chart. One series: 2 px
 * line, dots with a 2 px surface ring, hairline grid, the average and the
 * fastest run labelled, a crosshair on tap.
 */

const Y_AXIS_W = 40;
const X_AXIS_H = 20;
const TOP_PAD = 14;

export const PaceChart = ({
  points,
  average,
  height = 160,
  summary,
}: {
  points: PacePoint[];
  average: number | null;
  height?: number;
  summary: string;
}) => {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const plotW = Math.max(0, width - Y_AXIS_W - 8);
  const plotH = height - X_AXIS_H - TOP_PAD;
  const paces = points.map((p) => p.paceS);
  // Round the range out to whole 30-second steps so ticks read cleanly.
  const lo = Math.floor((Math.min(...paces) - 15) / 30) * 30;
  const hi = Math.ceil((Math.max(...paces) + 15) / 30) * 30;
  const span = Math.max(30, hi - lo);
  const xOf = (i: number) => Y_AXIS_W + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yOf = (p: number) => TOP_PAD + ((p - lo) / span) * plotH; // faster (smaller) = higher

  const fastestIdx = paces.indexOf(Math.min(...paces));
  const showDots = points.length <= 40;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(p.paceS).toFixed(1)}`).join("");

  const onPress = (e: GestureResponderEvent) => {
    if (!plotW || points.length === 0) return;
    const x = e.nativeEvent.locationX;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(xOf(i) - Y_AXIS_W - x) < Math.abs(xOf(best) - Y_AXIS_W - x)) best = i;
    });
    setSelected(selected === best ? null : best);
  };

  const sel = selected !== null ? points[selected] : null;

  return (
    <View>
      <View style={s.topRow}>
        <Text style={s.readout} numberOfLines={1} accessibilityLiveRegion="polite">
          {sel
            ? `${shortDate(sel.date)}: ${formatPace(sel.paceS)} /km over ${sel.km.toFixed(2)} km`
            : "Tap the line to see a run"}
        </Text>
        {average !== null && (
          <View style={s.avgKey}>
            <View style={s.avgSwatch} />
            <Text style={s.avgKeyText}>{`avg ${formatPace(average)}`}</Text>
          </View>
        )}
      </View>
      <View
        style={{ height }}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={summary}
      >
        {width > 0 && (
          <>
            <Svg width={width} height={height}>
              {[0, 0.5, 1].map((f) => (
                <Line key={f} x1={Y_AXIS_W} x2={width} y1={TOP_PAD + f * plotH} y2={TOP_PAD + f * plotH} stroke={KARELA.color.surfaceSoft} strokeWidth={1} />
              ))}
              {average !== null && (
                <Line x1={Y_AXIS_W} x2={width} y1={yOf(average)} y2={yOf(average)} stroke={KARELA.color.textMuted} strokeWidth={1} />
              )}
              {sel && (
                <Line x1={xOf(selected!)} x2={xOf(selected!)} y1={TOP_PAD} y2={TOP_PAD + plotH} stroke={KARELA.color.line} strokeWidth={1} />
              )}
              <Path d={line} stroke={KARELA.color.brand} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              {points.map((p, i) =>
                showDots || i === fastestIdx || i === selected || i === points.length - 1 ? (
                  <Circle
                    key={i}
                    cx={xOf(i)}
                    cy={yOf(p.paceS)}
                    r={i === selected ? 6 : 4}
                    fill={i === selected ? KARELA.color.textPrimary : KARELA.color.brand}
                    stroke={KARELA.color.surface}
                    strokeWidth={2}
                  />
                ) : null,
              )}
            </Svg>

            <Text style={[s.axis, s.yTick, { top: TOP_PAD - 7 }]}>{formatPace(lo)}</Text>
            <Text style={[s.axis, s.yTick, { top: TOP_PAD + plotH / 2 - 7 }]}>{formatPace(lo + span / 2)}</Text>
            <Text style={[s.axis, s.yTick, { top: TOP_PAD + plotH - 7 }]}>{formatPace(lo + span)}</Text>

            <Text style={[s.axis, { top: TOP_PAD + plotH + 4, left: Y_AXIS_W }]}>{shortDate(points[0].date)}</Text>
            {points.length > 1 && (
              <Text style={[s.axis, { top: TOP_PAD + plotH + 4, right: 0 }]}>{shortDate(points[points.length - 1].date)}</Text>
            )}

            {selected === null && points.length > 1 && (
              <Text
                style={[
                  s.best,
                  {
                    top: Math.max(0, yOf(points[fastestIdx].paceS) - 18),
                    left: Math.min(width - 80, Math.max(Y_AXIS_W, xOf(fastestIdx) - 40)),
                  },
                ]}
              >
                {`best ${formatPace(points[fastestIdx].paceS)}`}
              </Text>
            )}

            <Pressable
              onPress={onPress}
              style={[StyleSheet.absoluteFill, { left: Y_AXIS_W }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", gap: KARELA.space.sm, minHeight: 18, marginBottom: 4 },
  readout: { flex: 1, color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  avgKey: { flexDirection: "row", alignItems: "center", gap: 4 },
  avgSwatch: { width: 12, height: 1, backgroundColor: KARELA.color.textMuted },
  avgKeyText: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular },
  axis: { position: "absolute", color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular },
  yTick: { left: 0, width: Y_AXIS_W - 6, textAlign: "right" },
  best: { position: "absolute", width: 80, textAlign: "center", color: KARELA.color.textPrimary, fontSize: KARELA.size.caption, fontFamily: KARELA.font.bold },
});

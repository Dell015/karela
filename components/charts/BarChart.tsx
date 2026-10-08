import { KARELA } from "@/styles/designSystem";
import { useState } from "react";
import { GestureResponderEvent, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path, Rect } from "react-native-svg";

/**
 * Column chart for one series (distance per day, week or weekday).
 * Follows the dataviz rules: bars at most 24 px wide with a 4 px rounded
 * top and a square base, hairline gridlines, one colour, labels in text
 * colours (never the bar colour), the average and the best bar labelled,
 * the rest left to the tap readout and the table.
 */

const Y_AXIS_W = 34;
const X_AXIS_H = 20;
const TOP_PAD = 16;

export interface BarDatum {
  value: number;
  /** the readout line for this bar, e.g. "Tue, Oct 7: 3.2 km" */
  readout: string;
}

/** A round number at or above `v` for the top of the axis: 1, 2, 5, 10, 20, 50... */
export const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

const fmt = (v: number) => (v >= 10 ? `${Math.round(v)}` : v % 1 === 0 ? `${v}` : v.toFixed(1));

/** Column path: square at the baseline, 4 px rounded at the data end. */
const columnPath = (x: number, y: number, w: number, base: number) => {
  const r = Math.min(4, w / 2, base - y);
  return `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${base}Z`;
};

export const BarChart = ({
  data,
  height = 140,
  unit,
  xLabels,
  average,
  averageLabel,
  highlight,
  bestIndex,
  bestLabel,
  summary,
  labelWidth = 72,
  hint = "Tap a bar to see its day",
}: {
  data: BarDatum[];
  height?: number;
  /** "km": shown on the axis top tick */
  unit: string;
  /** a few x positions to label (first, middle, last...) */
  xLabels: { index: number; text: string }[];
  average?: number;
  averageLabel?: string;
  /** e.g. today: drawn as a hairline frame so it reads without a new colour */
  highlight?: number;
  bestIndex?: number;
  bestLabel?: string;
  /** what a screen reader hears for the whole chart */
  summary: string;
  /** width of each x label; narrow it when every bar is labelled */
  labelWidth?: number;
  /** readout text before anything is tapped */
  hint?: string;
}) => {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const plotW = Math.max(0, width - Y_AXIS_W);
  const plotH = height - X_AXIS_H - TOP_PAD;
  const max = niceMax(Math.max(...data.map((d) => d.value), average ?? 0));
  const slot = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(24, slot * 0.62));
  const base = TOP_PAD + plotH;
  const yOf = (v: number) => base - (v / max) * plotH;
  const xOf = (i: number) => Y_AXIS_W + i * slot + (slot - barW) / 2;

  const onPress = (e: GestureResponderEvent) => {
    if (!slot) return;
    const i = Math.floor(e.nativeEvent.locationX / slot);
    if (i >= 0 && i < data.length) setSelected(selected === i ? null : i);
  };

  const readout = selected !== null ? data[selected]?.readout : null;

  return (
    <View>
      {/* Readout row: the tapped bar's value (or a hint) and the average's key.
          The average is named here, not on the plot, so it never covers a bar. */}
      <View style={s.topRow}>
        <Text style={s.readout} numberOfLines={1} accessibilityLiveRegion="polite">
          {readout ?? hint}
        </Text>
        {average !== undefined && average > 0 && averageLabel && (
          <View style={s.avgKey}>
            <View style={s.avgSwatch} />
            <Text style={s.avgKeyText}>{averageLabel}</Text>
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
              {/* Gridlines: hairline, recessive, at 0, half and top */}
              {[0, 0.5, 1].map((f) => (
                <Line key={f} x1={Y_AXIS_W} x2={width} y1={yOf(max * f)} y2={yOf(max * f)} stroke={KARELA.color.surfaceSoft} strokeWidth={1} />
              ))}
              {data.map((d, i) => {
                const x = xOf(i);
                const on = selected === i;
                if (d.value <= 0) {
                  // Rest day: a short stub so the gap still reads as a day.
                  return <Rect key={i} x={x} y={base - 2} width={barW} height={2} rx={1} fill={KARELA.color.surfaceSoft} />;
                }
                const y = Math.min(yOf(d.value), base - 3);
                return (
                  <Path key={i} d={columnPath(x, y, barW, base)} fill={on ? KARELA.color.textPrimary : KARELA.color.brand} />
                );
              })}
              {highlight !== undefined && highlight >= 0 && highlight < data.length && (
                <Rect
                  x={Y_AXIS_W + highlight * slot + 1}
                  y={TOP_PAD - 4}
                  width={Math.max(2, slot - 2)}
                  height={plotH + 4}
                  rx={3}
                  fill="none"
                  stroke={KARELA.color.line}
                  strokeWidth={1}
                />
              )}
              {average !== undefined && average > 0 && (
                <Line x1={Y_AXIS_W} x2={width} y1={yOf(average)} y2={yOf(average)} stroke={KARELA.color.textMuted} strokeWidth={1} />
              )}
            </Svg>

            {/* Y axis: top tick carries the unit */}
            <Text style={[s.axis, s.yTick, { top: yOf(max) - 7 }]}>{`${fmt(max)} ${unit}`}</Text>
            <Text style={[s.axis, s.yTick, { top: yOf(max / 2) - 7 }]}>{fmt(max / 2)}</Text>
            <Text style={[s.axis, s.yTick, { top: base - 7 }]}>0</Text>

            {/* X labels, centred on their bar but kept inside the chart */}
            {xLabels.map((l) => {
              const centre = Y_AXIS_W + (l.index + 0.5) * slot;
              const left = Math.min(width - labelWidth, Math.max(Y_AXIS_W - 4, centre - labelWidth / 2));
              const align = left !== centre - labelWidth / 2 ? (left > centre - labelWidth / 2 ? "left" : "right") : "center";
              return (
                <Text key={l.index} style={[s.axis, { top: base + 4, width: labelWidth, textAlign: align, left }]} numberOfLines={1}>
                  {l.text}
                </Text>
              );
            })}

            {/* The best bar gets the one value label */}
            {bestIndex !== undefined && bestLabel && data[bestIndex]?.value > 0 && selected === null && (
              <Text
                style={[s.best, { top: Math.max(0, yOf(data[bestIndex].value) - 16), left: Math.min(width - 64, Math.max(Y_AXIS_W, xOf(bestIndex) + barW / 2 - 32)) }]}
                numberOfLines={1}
              >
                {bestLabel}
              </Text>
            )}

            {/* Tap layer over the plot: the column under the finger is the target. */}
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
  axis: {
    position: "absolute",
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.regular,
  },
  yTick: { left: 0, width: Y_AXIS_W - 4 },
  best: {
    position: "absolute",
    width: 64,
    textAlign: "center",
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.bold,
  },
});

import { KARELA } from "@/styles/designSystem";
import React from "react";
import type { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

/**
 * Karela's own icons, for the things only Karela has (Gems, streaks, the
 * Bayanihan hut, squads, guild banners, landmark flags...). Line drawings on
 * a 24 grid with one soft accent fill, so they read as a set and don't look
 * like a stock icon font. Universal controls (back, close, settings) keep
 * the standard icons people recognise instantly.
 */

type Shape = {
  /** outlined with the icon colour */
  lines: string[];
  /** filled with the accent colour, softly, behind the lines */
  fills?: string[];
  /** small solid dots: [cx, cy, r] */
  dots?: [number, number, number][];
};

const FLAME = "M12 2c.8 3.6 6.2 5.9 6.2 11.2a6.2 6.2 0 0 1-12.4 0c0-2.7 1.3-4.7 3-5.9.3 1.9 1.2 3.3 3.1 3.7-.6-3.9 0-6.7.1-9z";

const SHAPES = {
  gem: {
    lines: ["M6.5 4h11L22 9.5 12 21 2 9.5z", "M2 9.5h20", "M9 4l3 5.5L15 4", "M7.2 9.5 12 21l4.8-11.5"],
    fills: ["M6.5 4h11L22 9.5 12 21 2 9.5z"],
  },
  streak: {
    lines: [FLAME],
    fills: ["M12 12.6c2 1.5 3.1 2.9 3.1 4.4a3.1 3.1 0 0 1-6.2 0c0-1.5 1.1-2.9 3.1-4.4z"],
  },
  freeze: {
    lines: ["M12 2.5v19", "M3.8 7.2l16.4 9.6", "M3.8 16.8l16.4-9.6", "M9.6 3.9 12 6.3l2.4-2.4", "M9.6 20.1 12 17.7l2.4 2.4"],
    fills: ["M12 8.6 15 10.3v3.4L12 15.4 9 13.7v-3.4z"],
  },
  repair: {
    lines: [FLAME, "M6.6 15.4h10.8", "M9.4 14v2.8", "M12 14v2.8", "M14.6 14v2.8"],
    fills: [FLAME],
  },
  shield: {
    lines: ["M12 2.6 4.2 5.6v6c0 5 3.3 8.4 7.8 9.8 4.5-1.4 7.8-4.8 7.8-9.8v-6z", "M8.6 12.2l2.4 2.4 4.4-4.6"],
    fills: ["M12 2.6 4.2 5.6v6c0 5 3.3 8.4 7.8 9.8 4.5-1.4 7.8-4.8 7.8-9.8v-6z"],
  },
  /** The Bayanihan: neighbours carrying a nipa hut on bamboo poles. */
  bayanihan: {
    lines: ["M3 10.5 12 4l9 6.5", "M5.2 9.6v5.9h13.6V9.6", "M10.4 15.5v-3.3h3.2v3.3", "M2 18.5h20", "M7 15.5v3", "M17 15.5v3"],
    fills: ["M3 10.5 12 4l9 6.5z"],
    dots: [[4.5, 21, 1.2], [9.5, 21, 1.2], [14.5, 21, 1.2], [19.5, 21, 1.2]],
  },
  boost: {
    lines: ["M6 12.5 12 6.5l6 6", "M6 18.5l6-6 6 6"],
    fills: ["M12 6.5 18 12.5 12 12.5 6 12.5z"],
  },
  territory: {
    lines: ["M6.5 21V3.5", "M6.5 4.5h11L15 8l2.5 3.5h-11", "M3 21h8"],
    fills: ["M6.5 4.5h11L15 8l2.5 3.5h-11z"],
  },
  squad: {
    lines: [
      "M7.5 20.5a4.5 4.5 0 0 1 9 0",
      "M1.8 19.5a3.8 3.8 0 0 1 5.4-3.4",
      "M22.2 19.5a3.8 3.8 0 0 0-5.4-3.4",
      "M12 6.2m-2.8 0a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0-5.6 0",
      "M5.4 10.6m-2.1 0a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0-4.2 0",
      "M18.6 10.6m-2.1 0a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0-4.2 0",
    ],
    fills: ["M12 6.2m-2.8 0a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0-5.6 0"],
  },
  guild: {
    lines: ["M5.5 2.8h13v17.4L12 16.3l-6.5 3.9z", "M9 8.2l3 3 3-3"],
    fills: ["M5.5 2.8h13v17.4L12 16.3l-6.5 3.9z"],
  },
  crown: {
    lines: ["M3 8l4.6 4.2L12 5l4.4 7.2L21 8l-2 11H5z"],
    fills: ["M3 8l4.6 4.2L12 5l4.4 7.2L21 8l-2 11H5z"],
  },
  star: {
    lines: ["M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6-4.4-4.1 6-.8z"],
    fills: ["M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6-4.4-4.1 6-.8z"],
  },
  trail: {
    lines: ["M3.5 19.5c3 0 3.2-5.2 6.3-5.2s3 4 6 4 2.5-8.6 4.6-12.8"],
    dots: [[20.4, 5.5, 1.8]],
    fills: ["M3.5 19.5m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0"],
  },
  frame: {
    lines: ["M12 12m-8.5 0a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0", "M12 10m-2.6 0a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0", "M7.4 18.2a5 5 0 0 1 9.2 0"],
    fills: ["M12 12m-8.5 0a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0"],
  },
  xp: {
    lines: ["M13.2 2.5 5.2 13.2h6l-1 8.3 8.1-10.8h-6.1z"],
    fills: ["M13.2 2.5 5.2 13.2h6l-1 8.3 8.1-10.8h-6.1z"],
  },
  ghost: {
    lines: ["M5 21V11a7 7 0 0 1 14 0v10l-2.4-1.6L14.3 21 12 19.4 9.7 21l-2.3-1.6z"],
    fills: ["M5 21V11a7 7 0 0 1 14 0v10l-2.4-1.6L14.3 21 12 19.4 9.7 21l-2.3-1.6z"],
    dots: [[9.5, 11, 1.2], [14.5, 11, 1.2]],
  },
  civic: {
    lines: ["M12 21.8s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12z", "M12 6.2v4.4"],
    fills: ["M12 21.8s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12z"],
    dots: [[12, 13.4, 1.1]],
  },
  ticket: {
    lines: ["M3 7h18v3.2a1.8 1.8 0 0 0 0 3.6V17H3v-3.2a1.8 1.8 0 0 0 0-3.6z", "M14.5 7.5v1.6", "M14.5 11.2v1.6", "M14.5 14.9v1.6"],
    fills: ["M3 7h18v3.2a1.8 1.8 0 0 0 0 3.6V17H3v-3.2a1.8 1.8 0 0 0 0-3.6z"],
  },
  medal: {
    lines: ["M12 15m-5.5 0a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0", "M8.2 2.8 10.6 9.7", "M15.8 2.8 13.4 9.7", "M8.2 2.8h7.6"],
    fills: ["M12 15m-5.5 0a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0"],
  },
} satisfies Record<string, Shape>;

export type KarelaIconName = keyof typeof SHAPES;

interface KarelaIconProps {
  name: KarelaIconName;
  size?: number;
  /** line colour */
  color?: ColorValue;
  /** soft fill colour; defaults to the line colour */
  accent?: ColorValue;
  /** strength of the soft fill, 0 to 1 */
  fillOpacity?: number;
  strokeWidth?: number;
}

export const KarelaIcon = ({
  name,
  size = 24,
  color = KARELA.color.textPrimary,
  accent,
  fillOpacity = 0.28,
  strokeWidth = 1.8,
}: KarelaIconProps) => {
  const shape: Shape = SHAPES[name];
  const fill = accent ?? color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {shape.fills?.map((d, i) => (
        <Path key={`f${i}`} d={d} fill={fill} fillOpacity={fillOpacity} />
      ))}
      {shape.lines.map((d, i) => (
        <Path
          key={`l${i}`}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {shape.dots?.map(([cx, cy, r], i) => (
        <Circle key={`d${i}`} cx={cx} cy={cy} r={r} fill={color} />
      ))}
    </Svg>
  );
};

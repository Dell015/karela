/**
 * ============================================================
 * KARELA DESIGN SYSTEM — Single Source of Truth
 * ============================================================
 * Every color, gradient, font, spacing, radius, and shadow used
 * across the app should reference these tokens. No hardcoded hex
 * values in components.
 *
 * Aesthetic: deep dark surfaces lit by vibrant, luminous glow —
 * electric limes, tropical corals, tech-oranges, and neon teals —
 * matching the energetic Filipino fitness/civic theme of Karela.
 */

export const KARELA = {
  // --- Signature gradient (lime → teal) — the core brand ---
  gradient: ["#7CF205", "#209F77"] as const,
  gradientPlay: ["#7CF205", "#5BB104"] as const,

  // --- Core colors ---
  color: {
    brand: "#7CF205",
    brandDeep: "#209F77",

    bg: "#0d0d0d",
    bgGlow: "#101010",
    surface: "#1A1A1A",
    surfaceAlt: "#1F1F1F",
    surfaceSoft: "#222",

    line: "rgba(255,255,255,0.1)",
    lineSoft: "rgba(255,255,255,0.06)",

    textPrimary: "#FFFFFF",
    textSecondary: "#A0A0A0",
    textMuted: "#8A8A8A",
    textFaint: "#555",
    /** dark ink used ON bright gradient surfaces for AA contrast */
    onBright: "#04210A",

    danger: "#FF453A",
    gold: "#FFD700",
    civic: "#FF6B35",
  },

  // --- Vibrant accent palette (luminous, modern) ---
  vibrant: {
    electricLime: "#9EFF00",
    neonTeal: "#00F5D4",
    sky: "#00BBF9",
    techOrange: "#FF9F1C",
    coral: "#FF4D6D",
    magenta: "#FF006E",
    sunsetGold: "#FFD60A",
    flame: "#FB5607",
  },

  /**
   * Multi-stop gradient presets. Use sharper ones for CTAs,
   * softer ones for backdrops, glow versions for meters/borders.
   */
  gradients: {
    brand: ["#7CF205", "#209F77"] as const,
    aurora: ["#00F5D4", "#7CF205", "#00BBF9"] as const,   // calm/premium backdrop
    energy: ["#FFD60A", "#FF9F1C", "#FB5607"] as const,    // sunrise/CTA
    civic: ["#FF9F1C", "#FF4D6D", "#FF006E"] as const,     // hazard/coral
    pulse: ["#9EFF00", "#00F5D4"] as const,                // electric meter
    deep: ["#209F77", "#0d0d0d"] as const,                 // grounding fade
  },

  /**
   * Ambient glow-orb color sets per background variant.
   * Rendered as blurred circular blobs over the dark base.
   */
  glowSets: {
    default: ["#7CF205", "#209F77"] as const,
    energy: ["#FF9F1C", "#FF4D6D"] as const,
    civic: ["#FF6B35", "#FF006E"] as const,
    aurora: ["#00F5D4", "#9EFF00", "#00BBF9"] as const,
    calm: ["#209F77", "#00BBF9"] as const,
  },

  // --- Typography (Excon family) ---
  font: {
    black: "Excon-Black",
    bold: "Excon-Bold",
    medium: "Excon-Medium",
    regular: "Excon-Regular",
    thin: "Excon-Thin",
  },

  // --- Type scale ---
  size: {
    display: 32,
    h1: 24,
    h2: 18,
    body: 14,
    label: 12,
    caption: 10,
  },

  // --- 4-point spacing scale ---
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 },

  // --- Radius scale ---
  radius: { sm: 12, md: 15, lg: 20, xl: 30, pill: 999 },

  // --- Shadows / glow ---
  glow: {
    brand: {
      shadowColor: "#7CF205",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    coral: {
      shadowColor: "#FF4D6D",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
  },
};

export type GlowVariant = keyof typeof KARELA.glowSets;
export type GradientKey = keyof typeof KARELA.gradients;

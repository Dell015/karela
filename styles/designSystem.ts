/**
 * ============================================================
 * KARELA DESIGN SYSTEM — Single Source of Truth
 * ============================================================
 * Every color, gradient, font, spacing, radius, and shadow used
 * across the app should reference these tokens. No hardcoded hex
 * values in components.
 *
 * Matches the landing page (website-v2/css/tokens.css) so the app
 * and the site read as one product:
 *   - green-black surfaces (not neutral grey), like Ani's outfit
 *   - palette: lime, teal, aqua, sky, orange, coral, gold. No others.
 *   - off-white ink instead of pure #FFF (pure white on near-black
 *     glares, "halation", for many readers)
 *
 * Color roles (same as the site):
 *   brand (lime)   primary actions, selected chips, confirmed reports
 *   civic (orange) civic reporting, warnings (Bayanihan Watch/Warning)
 *   danger (coral) stop, destructive actions, hard lock
 *
 * Depth in dark mode comes from lighter surfaces (bg < surface <
 * surfaceAlt < surfaceSoft), not shadows. Keep shadows (glow.*) for
 * things that float over other content: the report button, sheets.
 */

export const KARELA = {
  // --- Signature gradient (lime → teal), used on primary buttons ---
  gradient: ["#7CF205", "#209F77"] as const,
  gradientPlay: ["#7CF205", "#5BB104"] as const,

  // --- Core colors ---
  color: {
    brand: "#7CF205",
    brandDeep: "#209F77",

    // Green-black surfaces, lightest last. Same values as the site.
    bg: "#0B0F0C",
    bgGlow: "#0B0F0C",
    surface: "#111813",
    surfaceAlt: "#17211A",
    surfaceSoft: "#1E2B22",

    line: "rgba(214,255,190,0.13)",
    lineSoft: "rgba(214,255,190,0.07)",

    textPrimary: "#F3F5EE", // headings and body (site --ink)
    textSecondary: "#B9C2B3", // secondary copy (site --ink-2)
    textMuted: "#939E8F", // captions, 6.9:1 on bg (site --ink-3)
    /** icons, dividers and disabled things only, not body text (about 3.5:1 on bg) */
    textFaint: "#5F6B61",
    /** dark ink used ON bright surfaces (lime, gradients, orange, coral) for contrast */
    onBright: "#04210A",

    danger: "#FF4D6D", // coral
    gold: "#FFD60A",
    civic: "#FF9F1C", // orange
  },

  // --- Accent palette (same set as the site) ---
  vibrant: {
    /** @deprecated kept so old code compiles; it is the brand lime now */
    electricLime: "#7CF205",
    neonTeal: "#00F5D4", // aqua
    sky: "#00BBF9",
    techOrange: "#FF9F1C",
    coral: "#FF4D6D",
    /** @deprecated not in the site palette; coral instead */
    magenta: "#FF4D6D",
    sunsetGold: "#FFD60A",
    /** @deprecated not in the site palette; orange instead */
    flame: "#FF9F1C",
  },

  /**
   * Multi-stop gradient presets. Use sharper ones for CTAs,
   * softer ones for backdrops, glow versions for meters/borders.
   */
  gradients: {
    brand: ["#7CF205", "#209F77"] as const,
    /** the site's .grad: for a short phrase of text, not whole headings */
    text: ["#7CF205", "#00F5D4", "#209F77"] as const,
    aurora: ["#00F5D4", "#7CF205", "#00BBF9"] as const, // calm backdrop
    energy: ["#FFD60A", "#FF9F1C"] as const, // sunrise
    civic: ["#FF9F1C", "#FF4D6D"] as const, // hazard
    pulse: ["#7CF205", "#00F5D4"] as const, // meters
    deep: ["#209F77", "#0B0F0C"] as const, // grounding fade
  },

  /**
   * Background glow palettes for <Screen variant>, the app version of the
   * site's data-palette sets (website-v2/js/main.js PAL). Three colours:
   * top-right blob, bottom-left blob, faint middle blob.
   */
  glowSets: {
    default: ["#7CF205", "#209F77", "#00F5D4"] as const, // site "lime"
    aurora: ["#00F5D4", "#00BBF9", "#7CF205"] as const, // site "aqua"
    calm: ["#00BBF9", "#209F77", "#00F5D4"] as const, // site "cool"
    energy: ["#FFD60A", "#FF9F1C", "#FF9F1C"] as const, // site "energy"
    ember: ["#FF9F1C", "#FF4D6D", "#209F77"] as const, // site "ember"
    civic: ["#FF9F1C", "#FF4D6D", "#FF9F1C"] as const, // site "civic", palette colours only
  },

  // --- Typography (Excon family) ---
  // React Native needs the font name per weight. Never use fontWeight
  // on its own: Android then falls back to the system font.
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
    body: 15,
    label: 12,
    caption: 11, // smallest size for readable text
  },

  // --- 4-point spacing scale ---
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 },

  /** Minimum tap target: 44pt on iOS, 48dp on Android. Use 48 for both. */
  tap: 48,

  // --- Radius scale: the site's values, deliberately not one size for everything ---
  radius: { sm: 8, md: 14, lg: 22, xl: 34, pill: 999 },

  // --- Shadows / glow: only for things floating over content ---
  glow: {
    brand: {
      shadowColor: "#7CF205",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    civic: {
      shadowColor: "#FF9F1C",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
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

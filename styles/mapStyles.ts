import { Dimensions, Platform, StyleSheet } from "react-native";
import { KARELA } from "./designSystem";

const { width, height } = Dimensions.get("window");

// Define the "iOS Hack" dash pattern to prevent default blue line behavior
const iOSSolidFiber = [100000, 0];

export const MAP_CONFIG = {
  futurePath: {
    strokeColor: "rgba(124, 242, 5, 0.4)",
    strokeWidth: 8,
    zIndex: 100,
    lineDashPattern: Platform.OS === "ios" ? iOSSolidFiber : undefined,
  },
  traversedPath: {
    strokeWidth: 8,
    zIndex: 200,
    lineDashPattern: Platform.OS === "ios" ? iOSSolidFiber : undefined,
  },
  questPath: {
    strokeColor: "rgba(255, 215, 0, 0.6)",
    strokeWidth: 6,
    zIndex: 150,
    lineDashPattern: Platform.OS === "ios" ? iOSSolidFiber : undefined,
  },
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KARELA.color.surface,
  },
  map: {
    width: width,
    height: height,
  },
  // --- Markers & Ghost ---
  markerWrapper: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  ghostMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: KARELA.color.brandDeep,
    borderWidth: 2,
    borderColor: KARELA.color.textPrimary,
  },
  // --- Quest System UI ---
  checkpointLabel: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: KARELA.color.gold,
    marginBottom: -5,
    zIndex: 1,
  },
  checkpointText: {
    color: KARELA.color.gold,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.bold,
  },
  questCard: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingVertical: 10,
    paddingHorizontal: KARELA.space.xl,
    borderRadius: KARELA.radius.lg,
    borderWidth: 1.5,
    borderColor: KARELA.color.gold,
    alignItems: "center",
    zIndex: 50,
  },
  rewardText: {
    color: KARELA.color.gold,
    fontFamily: KARELA.font.bold,
    fontSize: KARELA.size.body,
  },

  // --- Flags---
  calloutBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: KARELA.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: KARELA.space.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: KARELA.color.gold,
    width: 140,
    minHeight: 40,
  },
  calloutText: {
    color: KARELA.color.textPrimary,
    fontSize: 13,
    fontFamily: KARELA.font.bold,
    marginRight: KARELA.space.sm,
    textAlign: "center",
  },
  // --- Control Buttons ---
  // Positions only; the look comes from <IconButton> (components/ui/Button.tsx).
  rightButtonBase: {
    position: "absolute",
    right: KARELA.space.xl,
    zIndex: 100,
  },
  compassButton: { top: 50 },
  ghostButton: { top: 108 },
  flagSpawner: { top: 166 },

  backButton: {
    position: "absolute",
    top: 50,
    left: KARELA.space.xl,
    zIndex: 100,
  },
  flagCountBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    backgroundColor: KARELA.color.civic,
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: KARELA.color.bg,
  },
  flagCountText: {
    color: KARELA.color.onBright,
    fontSize: KARELA.size.caption,
    lineHeight: 14,
    fontFamily: KARELA.font.black,
    includeFontPadding: false,
  },
  // --- Trash System ---
  trashBinContainer: {
    position: "absolute",
    bottom: 150,
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
    zIndex: 2000,
  },
  trashBin: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
    padding: KARELA.space.xl,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: KARELA.color.danger,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    width: 110,
    height: 110,
  },
  trashText: {
    color: KARELA.color.danger,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.bold,
    marginTop: 5,
    textAlign: "center",
  },
  // --- Flag placement mode ---
  placeOverlay: { ...StyleSheet.absoluteFill, zIndex: 150 }, // absoluteFillObject no longer exists in RN 0.86
  // The dot is the exact spot (screen centre); the flag stands on it.
  placeDot: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    borderRadius: 7,
    backgroundColor: KARELA.color.gold,
    borderWidth: 3,
    borderColor: KARELA.color.bg,
  },
  placePin: {
    position: "absolute",
    bottom: "50%",
    left: "50%",
    marginLeft: -9, // the flag glyph's pole sits near its left edge
    marginBottom: 2,
  },
  placeBar: {
    width: "92%",
    alignSelf: "center",
    padding: KARELA.space.lg,
    borderRadius: KARELA.radius.lg,
    backgroundColor: "rgba(17,24,19,0.96)", // surface at 96%
    borderWidth: 1,
    borderColor: KARELA.color.line,
    ...KARELA.glow.soft,
  },
  placeTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  placeHint: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    marginTop: 2,
    marginBottom: KARELA.space.md,
  },
  placeActions: { flexDirection: "row", gap: KARELA.space.sm },
  // --- Start/Stop Button ---
  buttonContainer: {
    position: "absolute",
    bottom: KARELA.space.xxxl,
    width: "100%",
    alignItems: "center",
  },
  actionButton: {
    alignSelf: "center",
    minWidth: 200,
    borderRadius: KARELA.radius.pill,
  },
  // During a run: Pause and End side by side, thumb-sized.
  runControls: {
    flexDirection: "row",
    gap: KARELA.space.md,
    width: "100%",
    paddingHorizontal: KARELA.space.xl,
  },
});

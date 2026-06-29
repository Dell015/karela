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
  // --- HUD Overlay (Racing Stats) ---
  hudOverlay: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: KARELA.radius.sm,
    paddingVertical: KARELA.space.md,
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: KARELA.color.brand,
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 1000,
  },
  hudStat: {
    alignItems: "center",
    flex: 1,
  },
  hudLabel: {
    color: KARELA.color.textMuted,
    fontSize: 8,
    fontFamily: KARELA.font.bold,
    marginBottom: 2,
  },
  hudValue: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.black,
  },
  hudDivider: {
    width: 1,
    height: "60%",
    backgroundColor: KARELA.color.surfaceSoft,
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
  rightButtonBase: {
    position: "absolute",
    right: KARELA.space.xl,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    padding: KARELA.space.md,
    borderRadius: KARELA.radius.xl,
    borderWidth: 1.5,
    borderColor: KARELA.color.gold,
    zIndex: 100,
  },
  compassButton: { top: 50 },
  ghostButton: { top: 110 },
  flagSpawner: { top: 170 },

  backButton: {
    position: "absolute",
    top: 50,
    left: KARELA.space.xl,
    backgroundColor: KARELA.color.brand,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  flagCountBadge: {
    position: "absolute",
    top: -8,
    left: -8,
    backgroundColor: KARELA.color.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: KARELA.color.textPrimary,
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
  // --- Start/Stop Button ---
  buttonContainer: {
    position: "absolute",
    bottom: KARELA.space.xxxl,
    width: "100%",
    alignItems: "center",
  },
  actionButton: {
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 35,
    elevation: 8,
  },
  buttonText: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.space.xl,
    fontFamily: KARELA.font.bold,
    letterSpacing: 2,
  },
});

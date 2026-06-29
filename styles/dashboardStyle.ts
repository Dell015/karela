import { Dimensions, StyleSheet } from "react-native";
import { KARELA } from "./designSystem";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const dashboard_ui = StyleSheet.create({
  dashboard: {
    flex: 1,
    paddingHorizontal: KARELA.space.xl,
    backgroundColor: KARELA.color.bg,
    zIndex: 10,
  },
  ProfileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: KARELA.space.xl,
  },
  LeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  Image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: KARELA.color.brandDeep,
  },
  welcomeText: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
  },
  nameText: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h1,
    fontFamily: KARELA.font.bold,
  },

  menuButton: { padding: 5 },

  // --- PROGRESS CARD STYLES ---
  RunCard: {
    height: 130,
    borderRadius: KARELA.radius.md,
    overflow: "hidden",
    marginBottom: KARELA.space.sm,
    borderWidth: 1,
    padding: KARELA.space.xs,
    borderColor: "rgba(124, 242, 5, 0.3)",
  },
  CardOverlay: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  CardContent: {
    padding: 15,
    flex: 1,
    justifyContent: "center",
  },
  LevelLabel: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.medium,
    opacity: 0.7,
    letterSpacing: 1,
  },
  nameLabel: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.space.xl,
    fontFamily: KARELA.font.bold,
  },
  progressContainer: {
    width: "100%",
    marginTop: 10,
  },
  progressBarTrack: {
    width: "100%",
    height: 10,
    backgroundColor: KARELA.color.line,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: KARELA.color.brand,
    borderRadius: 5,
  },
  xpText: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.regular,
    textAlign: "right",
    marginTop: KARELA.space.xs,
  },

  // --- MAP PREVIEW STYLES ---
  sectionTitle: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.bold,
    marginBottom: KARELA.space.sm,
    marginTop: KARELA.space.sm,
  },
  mapPreviewContainer: {
    height: 180,
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.md,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "visible",
    marginTop: 10,
    marginBottom: KARELA.space.sm,
  },
  mapPlaceholder: {
    color: KARELA.color.textFaint,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
  },
  weatherOverlayIcon: {
    position: "absolute",
    top: -25,
    right: -10,
    width: 80,
    height: 80,
    zIndex: 10,
  },
  mapButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: KARELA.color.brand,
    paddingHorizontal: KARELA.space.md,
    paddingVertical: 6,
    borderRadius: KARELA.space.sm,
  },
  mapButtonText: {
    fontSize: 11,
    fontFamily: KARELA.font.bold,
    color: KARELA.color.textPrimary,
  },

  // --- CHARACTER GRID STYLES ---
  characterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  characterColumn: {
    width: "48%",
  },
  characterTitle: {
    color: KARELA.color.textPrimary,
    fontSize: 16,
    fontFamily: KARELA.font.bold,
    marginTop: KARELA.space.sm,
    marginBottom: KARELA.space.sm,
  },
  characterBox: {
    height: 300,
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.md,
  },

  // --- QUEST OVERVIEW STYLES ---
  questOverviewCard: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.md,
    padding: KARELA.space.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questOverviewText: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  questSmallBox: {
    width: 60,
    height: 60,
    backgroundColor: KARELA.color.surfaceSoft,
    borderRadius: KARELA.radius.sm,
  },

  // --- CHAT WITH ANI (INTEGRATED NESTED DESIGN) ---
  chatCardContainer: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg,
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 150,
    marginTop: 5,
    marginBottom: KARELA.space.xl,
  },
  chatSideBar: {
    width: KARELA.space.md,
    height: "100%",
  },
  chatContent: {
    flex: 1,
    padding: KARELA.space.xl,
    justifyContent: "space-between",
  },
  chatText: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    lineHeight: 20,
    marginBottom: 15,
  },
  nestedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: KARELA.color.textFaint,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: KARELA.space.sm,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  nestedInput: {
    flex: 1,
    color: KARELA.color.textPrimary,
    fontSize: 13,
    fontFamily: KARELA.font.regular,
  },

  // --- FLOATING ISLAND BUTTON STYLES ---
  islandWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },

  floatingButtonContainer: {
    position: "absolute",
    bottom: KARELA.space.xxxl,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  floatingIslandCircle: {
    width: 80,
    height: 80,
    borderRadius: KARELA.space.xxxl,
    ...KARELA.glow.brand,
    elevation: 12,
  },
  circularGradient: {
    flex: 1,
    borderRadius: KARELA.space.xxxl,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  // --- THE FLOATING ISLAND ---
  islandContainer: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: KARELA.space.xl,
    height: 100,
    zIndex: -999,
  },
  islandDock: {
    flexDirection: "row",
    backgroundColor: "rgba(28, 28, 28, 0.95)",
    borderRadius: KARELA.space.xxxl,
    height: 70,
    width: "90%",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: KARELA.color.line,
    ...KARELA.glow.soft,
    elevation: 20,
  },
  islandButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
  },
  islandButtonText: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.medium,
    marginTop: KARELA.space.xs,
  },
  // --- CENTER PLAY BUTTON ---
  playButtonOuter: {
    top: -25,
    shadowColor: KARELA.color.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  playButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: KARELA.color.bg,
  },

  // -- NEW: CHARACTER GRID TWEAKS --
  characterRow_View: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    zIndex: 50,
  },
  characterColumn_View: {
    width: "48%",
    overflow: "visible",
  },

  // -- NEW: EXPANDED CONSOLE VISUALS --
  consoleOverlay: {
    position: "absolute",
    bottom: 100,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: KARELA.space.xl,
  },
  consoleTitle: {
    color: KARELA.color.brand,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.black,
    letterSpacing: 2,
    marginBottom: KARELA.space.xl,
    textTransform: "uppercase",
  },
  btnRow: {
    flexDirection: "row",
    gap: 15,
  },
  commandBtn: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: KARELA.radius.md,
    alignItems: "center",
    width: 90,
    borderWidth: 1,
    borderColor: "rgba(124, 242, 5, 0.5)",
  },
  commandBtnActive: {
    backgroundColor: KARELA.color.brand,
    borderColor: KARELA.color.brand,
    shadowColor: KARELA.color.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  commandBtnText: {
    color: KARELA.color.brand,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.black,
    marginTop: 5,
  },
  commandBtnTextActive: {
    color: "#000",
  },
  closeConsoleBtn: {
    marginTop: KARELA.space.xxxl,
    padding: 10,
  },
  closeConsoleBtnText: {
    color: KARELA.color.textPrimary,
    opacity: 0.5,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.bold,
    letterSpacing: 2,
  },
  customizeBtn: {
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    borderWidth: 1,
    borderColor: KARELA.color.brand,
    borderRadius: KARELA.space.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    marginTop: KARELA.space.sm,
    gap: 5,
  },
  customizeBtnText: {
    color: KARELA.color.brand,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.black,
    letterSpacing: 1,
  },
  mapRoundedBox: {
    borderRadius: KARELA.radius.md,
    overflow: "hidden",
    height: 200,
    width: "100%",
    backgroundColor: KARELA.color.surface,
  },
  recenterBtn: {
    position: "absolute",
    left: KARELA.space.md,
    top: KARELA.space.md,
    backgroundColor: KARELA.color.brand,
    padding: KARELA.space.sm,
    borderRadius: KARELA.radius.sm,
    zIndex: 10,
  },
  loadingText: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    color: KARELA.color.brand,
    fontFamily: KARELA.font.medium,
  },
});

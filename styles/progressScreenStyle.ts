import { Dimensions, StyleSheet } from "react-native";
import { KARELA } from "./designSystem";

const { width } = Dimensions.get("window");

export const ProgressScreenUI = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: KARELA.space.xl,
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: "center",
  },
  headerTitle: { color: KARELA.color.textPrimary, fontFamily: KARELA.font.bold, fontSize: KARELA.size.body },

  // Level and XP
  profileSection: { alignItems: "center", marginBottom: 10 },
  rankText: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black },
  xpText: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: 2 },
  xpTrack: {
    width: Math.min(260, width * 0.6),
    height: 6,
    backgroundColor: KARELA.color.surfaceSoft,
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  xpFill: { height: "100%", backgroundColor: KARELA.color.brand, borderRadius: 3 },

  sectionContainer: { paddingHorizontal: KARELA.space.xl, marginTop: 25 },
  sectionTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: KARELA.space.sm },
  periodRow: { flexDirection: "row", gap: KARELA.space.sm, marginBottom: KARELA.space.md },

  // Period totals
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: { backgroundColor: KARELA.color.surface, borderRadius: KARELA.radius.lg },
  bigCard: { flex: 0.43, minHeight: 140, padding: 15, justifyContent: "space-between" },
  statsRightCol: { flex: 0.57, gap: 10 },
  statCardRow: { flexDirection: "row", gap: 10, flex: 1 },
  smallCard: {
    flex: 1,
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.md,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 62,
  },
  statLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
  statValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.display, fontFamily: KARELA.font.black },
  statUnit: { color: KARELA.color.textSecondary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  statFoot: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular },
  statLabelSmall: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular },
  statValueSmall: { color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },

  // 30-day chart card
  chartCard: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.lg,
    padding: KARELA.space.lg,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  chartStats: { flexDirection: "row", marginBottom: KARELA.space.md },
  chartStat: { flex: 1 },
  chartStatRule: { borderLeftWidth: 1, borderLeftColor: KARELA.color.line, paddingLeft: KARELA.space.md },
  chartStatValue: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  chartStatLabel: { color: KARELA.color.textMuted, fontSize: KARELA.size.caption, fontFamily: KARELA.font.regular, marginTop: 2 },
  chartNote: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.caption,
    fontFamily: KARELA.font.regular,
    lineHeight: 16,
    marginTop: KARELA.space.sm,
  },
  empty: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    lineHeight: 22,
    paddingVertical: KARELA.space.xl,
  },
});

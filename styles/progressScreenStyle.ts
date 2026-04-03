import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get('window');

/**
 * STRIDER PROGRESS SCREEN STYLES
 * Logic: 
 * - Bento boxes snap via statsSlide width.
 * - All cards share borderRadius (18) and backgroundColor (#1A1A1A).
 * - Standard 20px horizontal padding across all sections.
 */

export const ProgressScreenUI = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000" 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
  },
  
  // --- PROFILE SECTION ---
  profileSection: { 
    alignItems: "center", 
    marginBottom: 10 
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 10,
  },
  avatarGradient: { 
    flex: 1, 
    padding: 4 
  },
  avatarImage: { 
    flex: 1, 
    borderRadius: 60, 
    backgroundColor: "#1A1A1A" 
  },
  rankText: { 
    color: "white", 
    fontSize: 18, 
    fontWeight: "900",
    letterSpacing: 1
  },
  xpText: { 
    color: "#666", 
    fontSize: 12, 
    marginBottom: 15 
  },
  rankButton: {
    width: "60%",
    height: 45,
    borderRadius: 25,
    overflow: "hidden",
  },
  gradientButton: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  buttonText: { 
    color: "white", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  // --- UNIVERSAL SECTION STYLES ---
  sectionContainer: { 
    paddingHorizontal: 20, 
    marginTop: 25 
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  // --- BENTO BOX & SWIPE LOGIC ---
  swipeWrapper: {
    marginTop: 15,
  },
  statsSlide: {
    width: width, // Snaps exactly to screen width
    paddingHorizontal: 20, // Aligns bento boxes with titles
  },
  statsGrid: { 
    flexDirection: "row", 
    gap: 10, 
  },
  bigCard: {
    flex: 0.43,
    height: 140, // Height fixed for consistency
    padding: 15,
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
  },
  statsRightCol: { 
    flex: 0.57, 
    gap: 10 
  },
  statCard: { 
    backgroundColor: "#1A1A1A", 
    borderRadius: 18 
  },
  statCardRow: { 
    flexDirection: "row", 
    gap: 10, 
    flex: 1 
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  
  // --- STATS TYPOGRAPHY ---
  statLabel: { 
    color: "#888", 
    fontSize: 11, 
    fontWeight: "bold",
    textTransform: 'uppercase'
  },
  statValue: { 
    color: "white", 
    fontSize: 22, 
    fontWeight: "900" 
  },
  statLabelSmall: { 
    color: "#888", 
    fontSize: 9 
  },
  statValueSmall: { 
    color: "white", 
    fontSize: 12, 
    fontWeight: "bold" 
  },
  statIcon: { 
    alignSelf: "flex-end",
    opacity: 0.6 
  },
  miniPathLine: {
    height: 3,
    backgroundColor: "#7CF205", // Brand Green
    width: "40%",
    borderRadius: 2,
    marginTop: 5,
  },

  // --- PAGINATION DOTS ---
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#7CF205',
    width: 22, // Pill animation
  },
  activeIndicator: {
    backgroundColor: 'rgba(124, 242, 5, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeIndicatorText: {
    color: '#7CF205',
    fontSize: 9,
    fontWeight: '900',
  },

  // --- PLACEHOLDERS (MAP & GRAPH) ---
  cardPlaceholder: {
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    height: 130, // Matches bigCard for symmetry
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: '#222'
  },
  placeholderText: { 
    color: "#444", 
    marginTop: 8, 
    fontSize: 12, 
    textAlign: "center" 
  },

  // --- ACHIEVEMENTS ---
  achievementScroll: { 
    flexDirection: "row",
    marginTop: 5
  },
  achievementItem: { 
    alignItems: "center", 
    marginRight: 25 
  },
  achievementCircle: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#1A1A1A",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementTitle: { 
    color: "white", 
    fontSize: 12, 
    fontWeight: "bold" 
  },
  achievementProgress: { 
    color: "#666", 
    fontSize: 10,
    marginTop: 2
  },

  // --- BUTTON OVERLAYS ---
  mapBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#7CF205",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  mapBadgeText: { 
    fontSize: 9, 
    fontWeight: "bold",
    color: "#000"
  },
  
  backButton: {
    padding: 5
  },
  menuButton: {
    padding: 5
  },
});
import { StyleSheet } from 'react-native';

export const dashboard_ui = StyleSheet.create({
  dashboard: { 
    flex: 1, 
    paddingHorizontal: 20, 
    backgroundColor: '#0d0d0d' 
  },
  ProfileHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 20 
  },
  LeftGroup: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15 
  },
  Image: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#209F77' 
  },
  welcomeText: { 
    color: '#8A8A8A', 
    fontSize: 14 
  },
  nameText: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },

  // --- PROGRESS CARD STYLES ---
  RunCard: { 
    height: 130, 
    borderRadius: 15, 
    overflow: 'hidden', 
    marginBottom: 20,
    borderWidth: 1,
    padding: 4,
    borderColor: 'rgba(124, 242, 5, 0.3)'
  },
  CardOverlay: { 
    flex: 1, 
    borderRadius: 10, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  CardContent: { 
    padding: 15,
    flex: 1,
    justifyContent: 'center'
  },
  LevelLabel: { 
    color: '#fff', 
    fontSize: 10, 
    opacity: 0.7,
    letterSpacing: 1
  },
  nameLabel: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  progressContainer: { 
    width: '100%', 
    marginTop: 10 
  },
  progressBarTrack: { 
    width: '100%', 
    height: 10, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 5, 
    overflow: 'hidden' 
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: '#7CF205', 
    borderRadius: 5 
  },
  xpText: { 
    color: '#8A8A8A', 
    fontSize: 10, 
    textAlign: 'right', 
    marginTop: 4 
  },

  // --- MAP PREVIEW STYLES ---
  sectionTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginVertical: 12 
  },
  mapPreviewContainer: { 
    height: 180, 
    backgroundColor: '#1A1A1A', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    position: 'relative',
    overflow: 'visible' 
  },
  mapPlaceholder: { 
    color: '#444', 
    fontSize: 12 
  },
  weatherOverlayIcon: { 
    position: 'absolute', 
    top: -25, 
    right: -10, 
    width: 80, 
    height: 80,
    zIndex: 10
  },
  mapButton: { 
    position: 'absolute', 
    bottom: 15, 
    right: 15, 
    backgroundColor: '#7CF205', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  mapButtonText: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#ffffff' 
  },

  // --- CHARACTER GRID STYLES ---
  characterRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10 
  },
  characterColumn: { 
    width: '48%' 
  },
  characterTitle: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  characterBox: { 
    height: 150, 
    backgroundColor: '#1A1A1A', 
    borderRadius: 15 
  },

  // --- QUEST OVERVIEW STYLES ---
  questOverviewCard: { 
    backgroundColor: '#1A1A1A', 
    borderRadius: 15, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  questOverviewText: { 
    color: '#8A8A8A', 
    fontSize: 14, 
    flex: 1, 
    marginRight: 10,
    lineHeight: 20
  },
  questSmallBox: { 
    width: 60, 
    height: 60, 
    backgroundColor: '#333', 
    borderRadius: 12 
  },

  // --- CHAT WITH ANI (INTEGRATED NESTED DESIGN) ---
  chatCardContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 150,
    marginTop: 5,
    marginBottom: 20,
  },
  chatSideBar: {
    width: 12,
    height: '100%',
  },
  chatContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  chatText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  nestedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  nestedInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },

  // --- FLOATING ISLAND BUTTON STYLES ---
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  floatingIslandCircle: {
    width: 80, // Equal width and height
    height: 80,
    borderRadius: 40, // Half of width/height
    shadowColor: '#7CF205',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  circularGradient: {
    flex: 1,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle inner ring
  },
});
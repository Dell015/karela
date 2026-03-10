import { Dimensions, Platform, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

// Define the "iOS Hack" dash pattern to prevent default blue line behavior
const iOSSolidFiber = [100000, 0];

export const MAP_CONFIG = {
  futurePath: {
    strokeColor: "rgba(124, 242, 5, 0.4)",
    strokeWidth: 8,
    zIndex: 100,
    lineDashPattern: Platform.OS === 'ios' ? iOSSolidFiber : undefined,
  },
  traversedPath: {
    strokeWidth: 8,
    zIndex: 200,
    lineDashPattern: Platform.OS === 'ios' ? iOSSolidFiber : undefined,
  },
  questPath: {
    strokeColor: "rgba(255, 215, 0, 0.6)", // Slightly more opaque gold
    strokeWidth: 6,
    zIndex: 150,
    lineDashPattern: Platform.OS === 'ios' ? iOSSolidFiber : undefined,
  },
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Dark theme background
  },
  map: {
    width: width,
    height: height,
  },
  // --- HUD Overlay (Racing Stats) ---
  hudOverlay: {
    position: 'absolute',
    top: 50,
    left: 10,  // Reduced side margins to give more room
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Slightly darker for better contrast
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: '#7CF205',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1000,
  },
  hudStat: {
    alignItems: 'center',
    flex: 1, // Ensures each of the 5 stats takes up equal space
  },
  hudLabel: {
    color: '#888',
    fontSize: 8, // Smaller label
    fontWeight: 'bold',
    marginBottom: 2,
  },
  hudValue: {
    color: '#FFF',
    fontSize: 14, // Slightly smaller to prevent text wrapping on smaller phones
    fontWeight: '900',
  },
  hudDivider: {
    width: 1,
    height: '60%', // Shorter divider for a cleaner look
    backgroundColor: '#333',
  },
  // --- Markers & Ghost ---
  markerWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(32, 159, 119, 1)", 
    borderWidth: 2,
    borderColor: "#fff",
  },
  // --- Quest System UI ---
  checkpointLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginBottom: -5,
    zIndex: 1,
  },
  checkpointText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  questCard: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    alignItems: 'center',
    zIndex: 50,
  },
  rewardText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // --- Control Buttons ---
  // Remove individual 'top' from these so we can control them easily
  rightButtonBase: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 12,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    zIndex: 100,
  },
  // Use these specific positions
  compassButton: { top: 50 }, 
  ghostButton: { top: 110 },
  flagSpawner: { top: 170 },
  
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#7CF205',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  flagCountBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  // --- Trash System ---
  trashBinContainer: {
    position: 'absolute',
    bottom: 150,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    zIndex: 2000,
  },
  trashBin: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    padding: 20,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 110,
  },
  trashText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  // --- Start/Stop Button ---
  buttonContainer: {
    position: "absolute",
    bottom: 40,
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
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  
});
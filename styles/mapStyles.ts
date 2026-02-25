import { Dimensions, StyleSheet } from "react-native";

export const MAP_CONFIG = {
  futurePath: {
    strokeColor: "rgba(124, 242, 5, 0.20)",
    strokeWidth: 8,
  },
  traversedPath: {
    strokeColor: "#7CF205",
    strokeWidth: 8,
  },
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  // --- Markers ---
  marker: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#7CF205",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  markerWrapper: {
    width: 44,      // Larger than the dot (which is 20)
    height: 44,     // Larger than the dot
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    elevation: 0, 
    borderWidth: 0, 
  },
  ghostMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(32, 159, 119, 1)", 
    borderWidth: 2,
    borderColor: "#fff",
    margin: 0, 
    padding: 0,
  },
  // --- UI Elements ---
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
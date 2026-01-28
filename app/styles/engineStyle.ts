/**
 * 6. STYLES
 */

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#333'
  },
  statsBox: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 15, 
    width: '85%', 
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 5, 
    marginBottom: 30 
  },
  label: {
    fontSize: 16,
    marginVertical: 5,
    color: '#555',
    fontFamily: 'monospace' // Makes numbers easier to read
  },
  button: { 
    paddingVertical: 18, 
    borderRadius: 30, 
    width: '80%', 
    alignItems: 'center' 
  },
  startBtn: { backgroundColor: '#4CAF50' }, // Green for Go
  stopBtn: { backgroundColor: '#F44336' },  // Red for Stop
  buttonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 1
  },
  loadBtn: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 18, 
    borderRadius: 30, 
    width: '80%', 
    alignItems: 'center' 
  },

  btnText: {
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 1
  }
});
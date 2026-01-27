import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

/**
 * 1. IMPORTS
 * We bring in our logic files. Notice the pathing — this assumes 
 * your UI is in a different folder than your services.
 */
import { startRecording } from '../services/tracker/GhostRecorder'; 
import { GhostPoint } from '../services/tracker/GhostEngine';

export default function TestRecorderScreen() {
  /**
   * 2. STATE MANAGEMENT
   * currentPath: Stores the growing array of GPS points.
   * isRecording: Toggles the UI between "Start" and "Stop" modes.
   * subscription: Holds the active GPS watcher so we can kill it later.
   */
  const [currentPath, setCurrentPath] = useState<GhostPoint[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  /**
   * 3. START HANDLER
   * Triggered when the user hits "START RECORDING".
   */
  const handleStart = async () => {
    // UI Feedback: Change button color/text immediately
    setIsRecording(true);
    
    // Clear previous run data so we start fresh
    setCurrentPath([]);

    // Call our backend recorder. 
    // It takes a "callback" function that runs every time the GPS moves 5 meters.
    const sub = await startRecording((newPath) => {
      // Every time a new point is added, update the screen
      setCurrentPath(newPath);
    });

    // Save the subscription to memory so we can stop it later
    setSubscription(sub);
  };

  /**
   * 4. STOP HANDLER
   * Triggered when the user hits "STOP RECORDING".
   */
  const handleStop = () => {
    if (subscription) {
      // CRITICAL: This tells the phone's GPS hardware to stop sucking battery
      subscription.remove(); 
      setSubscription(null);
    }
    
    setIsRecording(false);

    // Logging the final array — this is what we will eventually save to AsyncStorage
    console.log("Run Finished! Total Points:", currentPath.length);
    console.log("Full Path Data:", currentPath);
  };

  /**
   * 5. DATA EXTRACTION
   * We grab the very last point in the array to show live stats (Speed, Distance, etc.)
   */
  const latestPoint = currentPath[currentPath.length - 1];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GPS Diagnostics</Text>
      
      {/* DISPLAY BOX: Shows live data from the Engine/Recorder */}
      <View style={styles.statsBox}>
        <Text style={styles.label}>Points Collected: {currentPath.length}</Text>
        
        {/* .toFixed(2) keeps the numbers from having 15 decimal places */}
        <Text style={styles.label}>
            Total Distance: {latestPoint?.distanceFromStart.toFixed(2) || 0}m
        </Text>
        
        <Text style={styles.label}>
            Lat: {latestPoint?.latitude.toFixed(5) || '0'}
        </Text>
        
        <Text style={styles.label}>
            Lon: {latestPoint?.longitude.toFixed(5) || '0'}
        </Text>
      </View>

      {/* DYNAMIC BUTTON: Switches styles based on isRecording state */}
      <TouchableOpacity 
        style={[styles.button, isRecording ? styles.stopBtn : styles.startBtn]} 
        onPress={isRecording ? handleStop : handleStart}
      >
        <Text style={styles.buttonText}>
            {isRecording ? "STOP RECORDING" : "START RECORDING"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * 6. STYLES
 */
const styles = StyleSheet.create({
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
  }
});
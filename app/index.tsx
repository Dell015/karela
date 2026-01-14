// 1. Import the "Brain" (React) and the "Logic Tools" (useState)
import React, { useState } from 'react';

// 2. Import the "Building Blocks" (Text, View, etc.)
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  // 3. Define your State here (Inside the function, before the return)
  const [isTracking, setIsTracking] = useState(false);

  return (
    <View style={styles.container}>
      
      {/* 4. This is your Dynamic Text */}
      <Text style={styles.statusText}>
        Status: {isTracking ? "Active" : "Idle"}
      </Text>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: isTracking ? '#209F77' : '#7CF205' }]}
        onPress={() => setIsTracking(!isTracking)}
      >
        <Text style={styles.buttonText}>
          {isTracking ? "STOP QUEST" : "START QUEST"}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

// 5. Your "Figma Design Panel"
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#151515",
  },
  statusText: {
    color: 'white',
    marginBottom: 20,
    fontSize: 18,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: "#151515",
    fontWeight: "bold",
    fontSize: 16,
  }
});
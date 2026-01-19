import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { initDatabase } from '../services/database/sqlite.service';
import { recordPoint } from '../services/tracker/recorder.logic';
import { startLocationTracking } from '../services/tracker/location.service';

export default function Dashboard() {
  const [distance, setDistance] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  
  // NEW: Debug mode to bypass strict thesis filters for indoor testing
  const [isDebugMode, setIsDebugMode] = useState(true); 
  
  const lastPointRef = useRef<any>(null);
  const dbRef = useRef<any>(null);

  useEffect(() => {
    initDatabase().then(db => {
      dbRef.current = db;
      addLog("Database Ready");
    });
  }, []);

  const addLog = (msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleStart = async () => {
    setIsTracking(true);
    setDistance(0); // Reset for new test
    lastPointRef.current = null;
    
    // Use a unique ID so the database doesn't get confused by "TEST_RUN" repeats
    const currentRunId = `TEST_${Date.now()}`; 
    addLog(`Starting: ${currentRunId}`);
    
    const subscription = await startLocationTracking(async (location) => {
      const { latitude, longitude, accuracy: acc } = location.coords;
      setAccuracy(acc || 0);

      // ADJUSTABLE GATEKEEPER
      // Outside: use 12m. Inside: use 100m.
      const threshold = isDebugMode ? 100 : 12;

      if (acc && acc > threshold) {
        addLog(`Blocked: Low Accuracy (${acc.toFixed(1)}m)`);
        return;
      }

      const newPoint = await recordPoint(
        dbRef.current, 
        currentRunId, 
        latitude, 
        longitude, 
        lastPointRef.current
      );
      
      // If the recorder returns the SAME point, it means the 3m filter blocked it
      if (newPoint === lastPointRef.current && lastPointRef.current !== null) {
        addLog(`Idle: Move > 3m (Current: ${acc?.toFixed(1)}m acc)`);
      } else {
        setDistance(newPoint.totalDistance);
        lastPointRef.current = newPoint;
        addLog(`FIX: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} | ${newPoint.totalDistance.toFixed(2)}m`);
      }
    });

    (global as any).testSub = subscription;
  };

  const handleStop = () => {
    setIsTracking(false);
    if ((global as any).testSub) (global as any).testSub.remove();
    addLog("Test Stopped.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ENGINE DASHBOARD</Text>
      
      <View style={styles.debugToggle}>
        <Text style={{color: '#fff'}}>Indoor Debug Mode (Relax Filters)</Text>
        <Switch 
            value={isDebugMode} 
            onValueChange={setIsDebugMode}
            trackColor={{ false: "#767577", true: "#00ff00" }}
        />
      </View>

      <View style={styles.monitor}>
        <Text style={styles.label}>LIVE DISTANCE</Text>
        <Text style={styles.mainValue}>{distance.toFixed(2)}m</Text>
        
        <View style={styles.accuracyRow}>
          <Text style={styles.label}>GPS SIGNAL: </Text>
          <Text style={[styles.accValue, accuracy > (isDebugMode ? 100 : 12) ? {color: '#ff4444'} : {color: '#00ff00'}]}>
            {accuracy > 0 ? `${accuracy.toFixed(1)}m` : 'Searching...'}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        {!isTracking ? (
          <TouchableOpacity style={styles.btnStart} onPress={handleStart}>
            <Text style={styles.btnText}>BEGIN FIELD TEST</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnStop} onPress={handleStop}>
            <Text style={styles.btnText}>STOP RECORDING</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.logContainer}>
        {log.map((line, i) => (
          <Text key={i} style={styles.logText}>{line}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 20 },
  header: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 40, textAlign: 'center' },
  debugToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 10, borderRadius: 10, marginTop: 10 },
  monitor: { backgroundColor: '#1a1a1a', padding: 30, borderRadius: 20, marginVertical: 20, alignItems: 'center' },
  label: { color: '#888', fontSize: 12, letterSpacing: 1 },
  mainValue: { color: '#fff', fontSize: 50, fontWeight: 'bold', marginVertical: 10 },
  accuracyRow: { flexDirection: 'row', alignItems: 'center' },
  accValue: { fontWeight: 'bold' },
  controls: { alignItems: 'center' },
  btnStart: { backgroundColor: '#00ff00', padding: 20, borderRadius: 50, width: '100%', alignItems: 'center' },
  btnStop: { backgroundColor: '#ff4444', padding: 20, borderRadius: 50, width: '100%', alignItems: 'center' },
  btnText: { fontWeight: 'bold', color: '#000' },
  logContainer: { flex: 1, marginTop: 20, backgroundColor: '#000', padding: 10, borderRadius: 10 },
  logText: { color: '#00ff00', fontSize: 10, fontFamily: 'Courier', marginBottom: 2 }
});
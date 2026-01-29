import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import {styles} from './styles/mapStyles';
import { GhostPoint } from '../services/tracker/GhostEngine';
import { startRecording } from '../services/tracker/GhostRecorder'; 
import { saveRun, loadRun} from '@/services/tracker/StorageService';
import { ghostMapStyle } from './styles/ghostMapStyle';


export default function MapsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentPath, setcurrentPath] = useState<GhostPoint[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  
  const latestPoint = currentPath.length > 0 
    ? { latitude: currentPath[currentPath.length - 1].latitude, longitude: currentPath[currentPath.length - 1].longitude }
    : location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null;

  const handleStart = async () => {
    setIsRecording(true);
    setcurrentPath([]);
    const sub = await startRecording((newPath) => {
        setcurrentPath(newPath);
    })
    setSubscription(sub);
  }

  const handleStop = async () => {
    if (subscription) {
        subscription.remove();
        setSubscription(null);
    }

    setIsRecording(false);

    if (currentPath.length > 0) {
        try {
            await saveRun(currentPath);
            alert("Run Saved!");
        } catch (error) {
            console.error("Save failed:", error);
        }
    }
  };

  const handleLoad = async () => {
    const savedPoints = await loadRun();
    if (savedPoints.length > 0) {
        setcurrentPath(savedPoints);
        alert(`Loaded ${savedPoints.length} points from last run!`);
    } else {
        alert("No Saved runs found.");
    }
  }


  useEffect(() => {
    (async () => {
      // Ask for permission to use GPS
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Get current position once to center the map
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  if (errorMsg) return <View style={styles.container}><Text>{errorMsg}</Text></View>;
  if (!location) return <View style={styles.container}><Text>Loading Map...</Text></View>;

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={ghostMapStyle} 
        initialRegion={{
          latitude: 14.5995,
          longitude: 120.9842,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Polyline
            coordinates={currentPath}
            strokeColor='#7CF205'
            strokeWidth={6}
        />

        {latestPoint && (
            <Marker
                coordinate={latestPoint}
                title='You'
            >
                <View style={{backgroundColor: '#7CF205', padding: 10, borderRadius: 20, borderWidth: 3, borderColor: 'white'}} />
            </Marker>
        )}
      </MapView>
      <TouchableOpacity
        style={[styles.floatingButtonContainer, isRecording ? styles.stopBtn : styles.startBtn]}
        onPress={isRecording ? handleStop : handleStart}
        >
            <Text style={styles.buttonText}>
                {isRecording ? "Stop Running" : "Start Running"}
            </Text>
        </TouchableOpacity>
    </View>
  );
}
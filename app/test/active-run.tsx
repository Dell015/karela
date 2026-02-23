import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function ActiveRunScreen() {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const heartScale = useSharedValue(1);

  // Simulated GPS Path near USL Tuguegarao
  const [routeCoordinates] = useState([
    { latitude: 17.6186, longitude: 121.7269 },
    { latitude: 17.6192, longitude: 121.7278 },
    { latitude: 17.6205, longitude: 121.7282 },
    { latitude: 17.6218, longitude: 121.7290 },
  ]);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => { setSeconds((prev) => prev + 1); }, 1000);
    } else { clearInterval(interval); }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 400 }), withTiming(1, { duration: 400 })),
      -1,
      true
    );
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const animatedHeart = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }]
  }));

  return (
    <View style={styles.container}>
      {/* BACKGROUND GPS LAYER */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={mapDarkStyle}
        initialRegion={{
          latitude: 17.6195,
          longitude: 121.7275,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Polyline 
          coordinates={routeCoordinates} 
          strokeColor="#7CF205" 
          strokeWidth={6} 
        />
      </MapView>

      {/* Visual Overlays for Readability */}
      <LinearGradient colors={['rgba(0,0,0,0.85)', 'transparent']} style={styles.topOverlay} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)', '#000']} style={styles.bottomOverlay} />

      <SafeAreaView style={styles.uiLayer}>
        {/* Header Section */}
        <View style={styles.miniHeader}>
          <Text style={styles.hardwareText}>Steven's Galaxy Buds Pro (1%)</Text>
          <View style={styles.liveDot} />
        </View>

        {/* Live Performance Metrics */}
        <View style={styles.mainStats}>
          <Text style={styles.label}>DURATION</Text>
          <Text style={styles.timerText}>{formatTime(seconds)}</Text>
          <View style={styles.secondaryGrid}>
            <View style={styles.statBox}>
              <Text style={styles.subLabel}>DISTANCE</Text>
              <Text style={styles.subValue}>4.20 <Text style={styles.unit}>km</Text></Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.subLabel}>BPM</Text>
              <View style={styles.bpmRow}>
                <Animated.View style={animatedHeart}>
                  <Ionicons name="heart" size={18} color="#FF453A" />
                </Animated.View>
                <Text style={styles.subValue}> 142</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Coach Karela Live Panel */}
        <View style={styles.footer}>
          <View style={styles.coachBubble}>
            <MaterialCommunityIcons name="account-tie-voice" size={24} color="#7CF205" />
            <Text style={styles.coachText}>"Karela here. You're maintaining a great pace on this route, Steven! Focus on your breathing."</Text>
          </View>

          {/* Control Interface */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.pauseBtn} onPress={() => setIsActive(!isActive)}>
              <Ionicons name={isActive ? "pause" : "play"} size={32} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.stopBtn} onLongPress={() => router.back()}>
              <LinearGradient colors={['#FF453A', '#941B15']} style={styles.stopGradient}>
                <Text style={styles.stopText}>HOLD TO FINISH</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const mapDarkStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#121212" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { width: width, height: height, position: 'absolute' },
  topOverlay: { position: 'absolute', top: 0, width: width, height: 220 },
  bottomOverlay: { position: 'absolute', bottom: 0, width: width, height: 480 },
  uiLayer: { flex: 1, paddingHorizontal: 25, justifyContent: 'space-between' },
  miniHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 },
  hardwareText: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7CF205' },
  mainStats: { alignItems: 'center', marginTop: 10 },
  label: { color: '#7CF205', letterSpacing: 2, fontSize: 14, fontWeight: 'bold' },
  timerText: { color: 'white', fontSize: 88, fontWeight: '200' },
  secondaryGrid: { flexDirection: 'row', width: '100%', marginTop: 20, justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  subLabel: { color: '#8E8E93', fontSize: 12, letterSpacing: 1 },
  subValue: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  bpmRow: { flexDirection: 'row', alignItems: 'center' },
  unit: { fontSize: 16, color: '#8E8E93' },
  footer: { marginBottom: 30 },
  coachBubble: { backgroundColor: 'rgba(28, 28, 30, 0.95)', padding: 20, borderRadius: 22, flexDirection: 'row', gap: 15, alignItems: 'center', marginBottom: 25 },
  coachText: { color: '#E5E5EA', flex: 1, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  controls: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  pauseBtn: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C' },
  stopBtn: { flex: 1 },
  stopGradient: { paddingVertical: 22, borderRadius: 22, alignItems: 'center' },
  stopText: { color: 'white', fontWeight: '900', letterSpacing: 1.5 }
});
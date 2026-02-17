import { useState } from "react"; 
import { View, StyleSheet, Dimensions } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { styles } from "@/styles/mapStyles"

export default function MapScreen() {

  //Manual input of coordinates 
  const [path, setPath] = useState([
    { latitude: 17.609017, longitude: 121.715140 },
    { latitude: 17.609022, longitude: 121.715525 },
    { latitude: 17.609039, longitude: 121.715851 },
    { latitude: 17.609233, longitude: 121.715812}
  ]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 17.609017,
          longitude: 121.715140,
          latitudeDelta: 0.0009,
          longitudeDelta: 0.0009,
        }}
      >
        {path.length > 1 && (
          <>
            <Polyline 
              coordinates={path}
              strokeColor="rgba(124, 242, 5, 0.4)"
              strokeWidth={18}
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              coordinates={path}
              strokeColor="#7CF205"
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}
        {path.length > 0 && (
          <Marker coordinate={path[path.length - 1]}>
            <View style={styles.marker} />
          </Marker>
        )}
      </MapView>
    </View>
  )
}
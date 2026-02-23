import { styles } from "@/styles/mapStyles";
import { useState } from "react";
import { View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function MapScreen() {
  //Manual input of coordinates
  const [path, setPath] = useState([]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 17.609017,
          longitude: 121.71514,
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
  );
}

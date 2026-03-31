// app/dashboard/profile.tsx
import { Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: 20 }}>Profile Loaded</Text>
    </View>
  );
}
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { theme } from "./styles/theme";

export default function Signup() {
  const router = useRouter();

  return (
    <View
      style={[
        theme.container,
        { justifyContent: "center", alignItems: "center" },
      ]}
    >
      <Text style={{ color: "white", fontSize: 24, marginBottom: 20 }}>
        Sign Up Page
      </Text>

      <TouchableOpacity style={theme.button} onPress={() => router.back()}>
        <Text style={theme.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

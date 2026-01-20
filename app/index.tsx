import { BlurView } from "expo-blur";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// IMPORTANT: Importing the two pieces we built
import { GradientText } from "../components/GradientText";
import { theme } from "./styles/theme";

export default function Index() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "Excon-Thin": require("../assets/fonts/Excon-Thin.otf"),
    "Excon-Light": require("../assets/fonts/Excon-Light.otf"),
    "Excon-Regular": require("../assets/fonts/Excon-Regular.otf"),
    "Excon-Medium": require("../assets/fonts/Excon-Medium.otf"),
    "Excon-Bold": require("../assets/fonts/Excon-Bold.otf"),
    "Excon-Black": require("../assets/fonts/Excon-Black.otf"),
  });

  if (!fontsLoaded) {
    return (
      <View
        style={[
          theme.container,
          {
            backgroundColor: "#151515",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color="#7CF205" />
      </View>
    );
  }

  return (
    <View style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={theme.glowContainer}>
        <LinearGradient
          colors={["#209F77", "#1FA279", "#7CF205"]}
          style={theme.rightBlur}
        />

        <LinearGradient
          colors={["#7CF205", "#1FA279", "#7CF205"]}
          style={theme.leftBlur}
        />
        <BlurView
          intensity={100} // Increase this (0-100) for more "fuzziness"
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <BlurView
          intensity={70} // Increase this (0-100) for more "fuzziness"
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={theme.content}>
        <Image
          source={require("../assets/images/karela_word-logo.png")}
          style={theme.logo}
        />

        {/* GRADIENT MASKING APPLIED HERE */}
        <Text style={theme.headline}>
          Your journey starts with{"\n"}
          <GradientText text="one step." style={theme.headline} />
        </Text>

        <Text style={theme.subtext}>
          Turn your daily movement into an adventure. Let's set up your first
          quest.
        </Text>

        <View style={theme.pagination}>
          <View style={[theme.dot, theme.activeDot]} />
          <View style={theme.dot} />
          <View style={theme.dot} />
          <View style={theme.dot} />
        </View>

        <TouchableOpacity
          style={theme.button}
          onPress={() => router.push("/quest")}
        >
          <LinearGradient
            colors={["#7CF205", "#209F77"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={theme.buttonGradient}
          >
            <Text style={theme.buttonText}>Next</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={theme.skipButton}
          onPress={() => router.push("/login")}
        >
          <Text style={theme.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

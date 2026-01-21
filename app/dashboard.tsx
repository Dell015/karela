import { Ionicons } from "@expo/vector-icons"; // Built-in icon library
import { Stack } from "expo-router"; // Component to control the native nav bar
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "./styles/theme";
import { dashboard_ui } from "./styles/dashboard";

// 'export default' = The main class/function of this file (Like 'public static void Main' logic)
export default function Dashboard() {
  return (
    // SafeAreaView: A specialized "Box" that respects the iPhone Notch/Home Indicator
    <SafeAreaView style={theme.container}>
      {/* 1. NATIVE HEADER CONFIG (Headless Tag)
          Similar to setting properties in a C# Constructor */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 2. MAIN HEADER ROW (The Outer Box)
          flexDirection: 'row' acts like a horizontal StackPanel in C# */}
      <View style={dashboard_ui.headerRow}>
        {/* LEFT GROUP: Circle + Text (Inner Box) */}
        <View style={dashboard_ui.profileGroup}>
          {/* THE CIRCLE: Just a View with borderRadius = 50% of size */}
          <View style={dashboard_ui.profileCircle} />
          {/* THE TEXT STACK: flexDirection is 'column' by default (like a Python List of strings) */}
          <View style={dashboard_ui.textStack}>
            <Text style={dashboard_ui.welcomeText}>Welcome back,</Text>
            <Text style={dashboard_ui.userName}>Randel</Text>
          </View>
        </View>

        {/* RIGHT GROUP: Chat Icon
            TouchableOpacity = A button with built-in "Opacity" animation on click */}
        <TouchableOpacity
          style={dashboard_ui.iconButton}
          onPress={() => console.log("Chat Pressed")}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* --- Rest of your dashboard content will go here --- */}
    </SafeAreaView>
  );
}

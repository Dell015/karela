import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router"; // Component to control the native nav bar
import { Ionicons } from "@expo/vector-icons"; // Built-in icon library
import { theme } from "./styles/theme";

// 'export default' = The main class/function of this file (Like 'public static void Main' logic)
export default function Dashboard() {
  return (
    // SafeAreaView: A specialized "Box" that respects the iPhone Notch/Home Indicator
    <SafeAreaView style={styles.container}>
      
      {/* 1. NATIVE HEADER CONFIG (Headless Tag)
          Similar to setting properties in a C# Constructor */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 2. MAIN HEADER ROW (The Outer Box)
          flexDirection: 'row' acts like a horizontal StackPanel in C# */}
      <View style={styles.headerRow}>
        
        {/* LEFT GROUP: Circle + Text (Inner Box) */}
        <View style={styles.profileGroup}>
          {/* THE CIRCLE: Just a View with borderRadius = 50% of size */}
          <View style={styles.profileCircle} />

          {/* THE TEXT STACK: flexDirection is 'column' by default (like a Python List of strings) */}
          <View style={styles.textStack}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Randel</Text>
          </View>
        </View>

        {/* RIGHT GROUP: Chat Icon
            TouchableOpacity = A button with built-in "Opacity" animation on click */}
        <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Chat Pressed')}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
        </TouchableOpacity>

      </View>

      {/* --- Rest of your dashboard content will go here --- */}

    </SafeAreaView>
  );
}

// --- STYLES (The "Attributes" or "CSS" of the Boxes) ---
const styles = StyleSheet.create({
  container: {
    flex: 1, // Fill 100% of the screen (Like 'Dock.Fill' in C#)
    backgroundColor: '#121212', // Fallback if theme isn't loaded
  },
  headerRow: {
    flexDirection: 'row', // Align children horizontally (Side-by-side)
    justifyContent: 'space-between', // Push children to far left and far right
    alignItems: 'center', // Center them vertically relative to each other
    paddingHorizontal: 20, // Padding on left and right
    paddingVertical: 15,   // Padding on top and bottom
  },
  profileGroup: {
    flexDirection: 'row', // Keep circle and text stack next to each other
    alignItems: 'center',
    gap: 12, // The space between the circle and the text
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25, // Logic: Size / 2 = Perfect Circle
    backgroundColor: '#26A69A', // Your Emerald/Green accent
  },
  textStack: {
    justifyContent: 'center',
  },
  welcomeText: {
    color: '#888', // Grayish sub-text
    fontSize: 14,
    fontFamily: 'System', // You can replace with your 'Excon' font later
  },
  userName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconButton: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.1)', // Semi-transparent "Glass" effect
    borderRadius: 12,
    justifyContent: 'center', // Center icon horizontally
    alignItems: 'center',     // Center icon vertically
  }
});
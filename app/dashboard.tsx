import { Ionicons } from "@expo/vector-icons"; // Built-in icon library
import { router, Stack } from "expo-router"; // Component to control the native nav bar
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "./styles/theme";
import { dashboard_ui } from "./styles/dashboard";
import { Assets } from "@react-navigation/elements";
import { Image } from "react-native";
import { push } from "expo-router/build/global-state/routing";

// 'export default' = The main class/function of this file (Like 'public static void Main' logic)
export default function Dashboard() {
  return (
    // SafeAreaView: A specialized "Box" that respects the iPhone Notch/Home Indicator
    <SafeAreaView style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={dashboard_ui.dashboard}>

        <View style={dashboard_ui.ProfileHeader}>

          <View style={dashboard_ui.LeftGroup}>
            <TouchableOpacity 
              onPress={() => { router.push('/profile'); }}
              activeOpacity={0.7 }
              >
                <Image
                  source={require("../assets/images/sir-sander.jpg")}
                  style={dashboard_ui.Image}
            />
            </TouchableOpacity>
            <View>
              <Text style={dashboard_ui.welcomeText}>Welcome back</Text>
              <Text style={dashboard_ui.nameText}>Sir Sander</Text>
            </View>
          </View>



          <View style={dashboard_ui.RightGroup}>
            <TouchableOpacity 
              onPress={() => { router.push('/ai_coach'); }}
            >
              <Image
                source={require("../assets/images/coach.png")}
                style={dashboard_ui.CoachImage}
            />
            </TouchableOpacity>
            
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

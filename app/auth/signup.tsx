import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../styles/theme";
// Import the registration function we updated in auth.ts
import { registerUser } from "../../services/database/firebase/auth";

/**
 * REUSABLE INPUT COMPONENT
 */
interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "numeric" | "email-address";
}

const UserInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
}: InputProps) => (
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="rgba(255, 255, 255, 0.5)"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  </View>
);

export default function Signup() {
  const router = useRouter();

  // -- AUTH STATE --
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // -- ADAPTIVE ENGINE STATE (Bio-Data) --
  const [weight, setWeight] = useState(""); // kg
  const [height, setHeight] = useState(""); // cm
  const [age, setAge] = useState("");

  /**
   * HANDLER: Registration & Initial Analytics
   */
  const handleSignup = async () => {
    // 1. Basic Validation
    if (!email || !password || !weight || !height || !age) {
      Alert.alert("Required Fields", "Please fill in your physical profile so we can generate your missions.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 2. Calculate Baseline Metrics for the Thesis Engine
      const hMeters = parseFloat(height) / 100;
      const wKg = parseFloat(weight);
      const bmi = wKg / (hMeters * hMeters);

      // 3. Construct the Personalized User Object
      const userData = {
        displayName: fullName, // Use 'displayName' to match Firebase/AuthContext
        username: username,
        stats: {                // Change 'bio' to 'stats' to match your Interface
          weight: wKg,
          height: parseFloat(height),
          age: parseInt(age),
          bmi: parseFloat(bmi.toFixed(2)),
          // Add these defaults so the user isn't missing fields!
          level: 1,
          xp: 0,
          fitness_score: 1.0,
          streak: 0,
          longest_streak: 0,
          last_active_date: new Date().toISOString(),
          total_distance_km: 0,
          total_calories_burned: 0,
          total_missions_completed: 0,
          avg_pace_mins_km: 0,
          target_weight: wKg,
        },
        settings: {
          units: "metric",
          notifications: true,
        },
        createdAt: new Date().toISOString(),
      };

      // 4. Call the Firebase Auth Service (Now includes Email Verification)
      await registerUser(email, password, userData);

      // 5. Success Feedback
      Alert.alert(
        "Verify Your Email", 
        `A verification link has been sent to ${email}. Please verify your email before logging in.`,
        [{ text: "Go to Login", onPress: () => router.replace("/auth/login") }]
      );

    } catch (error: any) {
      console.error("Signup failed:", error);
      let msg = "An error occurred during signup.";
      if (error.code === 'auth/email-already-in-use') msg = "This email is already registered.";
      if (error.code === 'auth/invalid-email') msg = "Invalid email format.";
      if (error.code === 'auth/weak-password') msg = "Password is too weak (min 6 chars).";
      
      Alert.alert("Signup Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* BACKGROUND VISUALS */}
      <View style={theme.glowContainer}>
        <LinearGradient colors={["#209F77", "#1FA279", "#7CF205"]} style={theme.rightBlur} />
        <LinearGradient colors={["#7CF205", "#1FA279", "#7CF205"]} style={theme.leftBlur} />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/karela_word-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Tell us about yourself to tailor your missions.</Text>
          </View>

          {/* FORM SECTION */}
          <View style={styles.form}>
            <UserInput placeholder="Full Name" value={fullName} onChangeText={setFullName} />
            <UserInput placeholder="Username" value={username} onChangeText={setUsername} />
            <UserInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            
            {/* BIO-DATA ROW */}
            <View style={styles.bioRow}>
                <View style={{flex: 1}}>
                    <UserInput placeholder="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                    <UserInput placeholder="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                    <UserInput placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
                </View>
            </View>

            <UserInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <UserInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

            {/* ACTION BUTTON */}
            <TouchableOpacity 
                style={[styles.signupBtn, loading && { opacity: 0.7 }]} 
                onPress={handleSignup}
                disabled={loading}
            >
              <LinearGradient
                colors={["#7CF205", "#209F77"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.signupBtnText}>Analyze & Sign up</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.loginText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 20,
    tintColor: "#7CF205",
  },
  title: {
    fontSize: 28,
    fontFamily: "Excon-Bold",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: 'center',
    marginTop: 8,
    fontFamily: "Excon-Regular",
  },
  form: {
    gap: 18,
  },
  bioRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
    paddingBottom: 5,
  },
  input: {
    fontFamily: "Excon-Regular",
    color: "#fff",
    fontSize: 16,
    paddingVertical: 10,
  },
  signupBtn: {
    marginTop: 20,
    borderRadius: 30,
    overflow: "hidden",
  },
  gradientBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 55, // Prevents button shrinking when loading
  },
  signupBtnText: {
    color: "#fff",
    fontFamily: "Excon-Bold",
    fontSize: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    color: "#888",
    fontFamily: "Excon-Regular",
  },
  loginText: {
    color: "#7CF205",
    fontFamily: "Excon-Bold",
  },
});
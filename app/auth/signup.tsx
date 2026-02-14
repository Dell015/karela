import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { theme } from "../styles/theme";

/**
 * REUSABLE INPUT COMPONENT
 * Keeping this outside the main function makes the code cleaner and easier to style globally.
 */
interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
}

const UserInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
}: InputProps) => (
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="rgba(255, 255, 255, 0.5)"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
    />
  </View>
);

/**
 * MAIN SIGNUP SCREEN
 * Handles user registration and state management for the Karela app.
 */
export default function Signup() {
  const router = useRouter();

  // -- STATE (MEMORY) --
  // These variables store what the user types in real-time.
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <View style={theme.container}>
      {/* Hides the default Expo router header for a full-screen custom look */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* BACKGROUND VISUAL EFFECTS 
          Uses a combination of Gradients and Blur to create the "Karela Glow" effect.
      */}
      <View style={theme.glowContainer}>
        <LinearGradient
          colors={["#209F77", "#1FA279", "#7CF205"]}
          style={theme.rightBlur}
        />
        <LinearGradient
          colors={["#7CF205", "#1FA279", "#7CF205"]}
          style={theme.leftBlur}
        />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      {/* KEYBOARD HANDLING
          Ensures that when the user taps an input, the keyboard doesn't cover the 'Sign Up' button.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* HEADER SECTION (Logo & Title) */}
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/karela_word-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create your account</Text>
          </View>

          {/* FORM SECTION
              Captures all user details. Note: confirmPassword logic will need validation later.
          */}
          <View style={styles.form}>
            <UserInput
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />

            <UserInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />

            <UserInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />

            <UserInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <UserInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {/* SIGN UP BUTTON 
                Currently only logs to console. Integrate with Auth service here.
            */}
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => console.log("Sign Up clicked for:", fullName)}
            >
              <LinearGradient
                colors={["#7CF205", "#209F77"]} // Karela Brand Gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.signupBtnText}>Sign up</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* FOOTER SECTION
              Navigation link for users who already have an account.
          */}
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

// --- STYLING (LOCAL) ---
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
    tintColor: "#7CF205", // Forces the logo to match our Karela Green
  },
  title: {
    fontSize: 28,
    fontFamily: "Excon-Bold",
    color: "#fff",
    textAlign: "center",
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.5)",
    paddingBottom: 5,
  },
  input: {
    fontFamily: "Excon-Regular",
    color: "#fff",
    fontSize: 16,
    paddingVertical: 10,
  },
  signupBtn: {
    marginTop: 30,
    borderRadius: 30,
    overflow: "hidden", // Required to make the gradient follow the border radius
  },
  gradientBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  signupBtnText: {
    color: "#fff",
    fontFamily: "Excon-Bold",
    fontSize: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 20,
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
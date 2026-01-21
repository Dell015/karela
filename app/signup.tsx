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
import { theme } from "./styles/theme";

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

// MAIN SIGNUP SCREEN

export default function Signup() {
  const router = useRouter();

  // -- STATE (MEMORY) --
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // -- THE UI --
  return (
    <View style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Effects (Same as Login) */}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header (Logo + Title) */}
          <View style={styles.header}>
            <Image
              // We use the same logo as Login
              source={require("../assets/images/karela_word-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create your account</Text>
          </View>

          {/* Form Section */}
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

            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => console.log("Sign Up clicked:", fullName)}
            >
              <LinearGradient
                colors={["#7CF205", "#209F77"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.signupBtnText}>Sign up</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer (Login Link) */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            {/* Navigates back to Login */}
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.loginText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// STYLES

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
    overflow: "hidden",
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

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
  Alert,
  ActivityIndicator,
} from "react-native";
import { theme } from "../../styles/theme";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../services/database/firebase/config";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // 1. Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. THESIS SECURITY: Check if email is verified
      if (!user.emailVerified) {
        // If not verified, kick them out and alert them
        await signOut(auth); 
        Alert.alert(
          "Email Not Verified",
          "Please click the link sent to your email before logging in. Check your spam folder if you don't see it!",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }

      // 3. Success! Move to Dashboard
      router.replace("/dashboard/dashboard");

    } catch (error: any) {
      console.error(error);
      let errorMessage = "Invalid email or password.";
      
      if (error.code === 'auth/user-not-found') errorMessage = "No account found with this email.";
      if (error.code === 'auth/wrong-password') errorMessage = "Incorrect password.";
      
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={theme.glowContainer}>
        <LinearGradient colors={["#209F77", "#7CF205"]} style={theme.rightBlur} />
        <LinearGradient colors={["#7CF205", "#209F77"]} style={theme.leftBlur} />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/karela_word-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to continue your missions.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity 
              style={[styles.loginBtn, loading && { opacity: 0.7 }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#7CF205", "#209F77"]}
                style={styles.gradientBtn}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Log In</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Karela? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/signup")}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 24, paddingTop: 100 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { width: 80, height: 80, marginBottom: 20, tintColor: "#7CF205" },
  title: { fontSize: 32, fontFamily: "Excon-Bold", color: "#fff" },
  subtitle: { color: "rgba(255,255,255,0.6)", marginTop: 10 },
  form: { gap: 20 },
  inputContainer: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.3)" },
  input: { color: "#fff", paddingVertical: 12, fontSize: 16 },
  loginBtn: { borderRadius: 30, overflow: "hidden", marginTop: 20 },
  gradientBtn: { paddingVertical: 16, alignItems: "center" },
  loginBtnText: { color: "#fff", fontSize: 18, fontFamily: "Excon-Bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 40 },
  footerText: { color: "#888" },
  signupText: { color: "#7CF205", fontFamily: "Excon-Bold" },
});
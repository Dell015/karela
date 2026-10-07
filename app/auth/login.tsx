import { KARELA } from "@/styles/designSystem";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { signIn } from "../../services/database/supabase/auth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      router.replace("/drawer/dashboard");
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Invalid email or password.";

      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("email not confirmed")) {
        errorMessage =
          "Please verify your email before logging in. Check your inbox (and spam folder) for the confirmation link.";
      } else if (msg.includes("invalid login credentials")) {
        errorMessage = "Incorrect email or password.";
      }

      Alert.alert("Couldn't log in", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen variant="default">
      <Stack.Screen options={{ headerShown: false }} />

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

            <Button label="Log in" block loading={loading} onPress={handleLogin} style={styles.loginBtn} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Karela? </Text>
            <Button label="Sign up" variant="link" onPress={() => router.push("/auth/signup")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 24, paddingTop: 100 },
  header: { alignItems: "center", marginBottom: KARELA.space.xxxl },
  logo: { width: 80, height: 80, marginBottom: KARELA.space.xl, tintColor: KARELA.color.brand },
  title: { fontSize: KARELA.size.display, fontFamily: KARELA.font.bold, color: KARELA.color.textPrimary },
  subtitle: { color: "rgba(255,255,255,0.6)", marginTop: 10, fontFamily: KARELA.font.regular },
  form: { gap: KARELA.space.xl },
  inputContainer: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.3)" },
  input: { color: KARELA.color.textPrimary, paddingVertical: KARELA.space.md, fontSize: 16, fontFamily: KARELA.font.regular },
  loginBtn: { marginTop: KARELA.space.xl },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: KARELA.space.xs, marginTop: KARELA.space.xxxl },
  footerText: { color: KARELA.color.textMuted, fontFamily: KARELA.font.regular },
});

import { KARELA } from "@/styles/designSystem";
import { Screen } from "@/components/ui/Screen";
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
import { registerUser } from "../../services/database/supabase/auth";

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

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");

  const handleSignup = async () => {
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
      const hMeters = parseFloat(height) / 100;
      const wKg = parseFloat(weight);
      const bmi = wKg / (hMeters * hMeters);

      const userData = {
        displayName: fullName,
        username: username,
        stats: {
          weight: wKg,
          height: parseFloat(height),
          age: parseInt(age),
          bmi: parseFloat(bmi.toFixed(2)),
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

      await registerUser(email, password, userData);

      Alert.alert(
        "Verify Your Email", 
        `A verification link has been sent to ${email}. Please verify your email before logging in.`,
        [{ text: "Go to Login", onPress: () => router.replace("/auth/login") }]
      );

    } catch (error: any) {
      console.error("Signup failed:", error);
      let msg = "An error occurred during signup.";
      const m = (error?.message || "").toLowerCase();
      if (m.includes("already registered") || m.includes("already been registered"))
        msg = "This email is already registered.";
      if (m.includes("invalid email")) msg = "Invalid email format.";
      if (m.includes("password")) msg = "Password is too weak (min 6 chars).";

      Alert.alert("Signup Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen variant="default">
      <Stack.Screen options={{ headerShown: false }} />

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
                colors={KARELA.gradients.brand as unknown as string[]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                {loading ? (
                    <ActivityIndicator color={KARELA.color.textPrimary} />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: KARELA.space.xxxl,
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: KARELA.space.xl,
    tintColor: KARELA.color.brand,
  },
  title: {
    fontSize: KARELA.size.h1 + 4,
    fontFamily: KARELA.font.bold,
    color: KARELA.color.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: KARELA.size.body,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: KARELA.space.sm,
    fontFamily: KARELA.font.regular,
  },
  form: {
    gap: 18,
  },
  bioRow: {
    flexDirection: "row",
    gap: KARELA.space.md,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
    paddingBottom: 5,
  },
  input: {
    fontFamily: KARELA.font.regular,
    color: KARELA.color.textPrimary,
    fontSize: 16,
    paddingVertical: 10,
  },
  signupBtn: {
    marginTop: KARELA.space.xl,
    borderRadius: KARELA.radius.xl,
    overflow: "hidden",
  },
  gradientBtn: {
    paddingVertical: KARELA.space.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 55,
  },
  signupBtnText: {
    color: KARELA.color.textPrimary,
    fontFamily: KARELA.font.bold,
    fontSize: KARELA.size.h2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    color: KARELA.color.textMuted,
    fontFamily: KARELA.font.regular,
  },
  loginText: {
    color: KARELA.color.brand,
    fontFamily: KARELA.font.bold,
  },
});

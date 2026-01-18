import { AntDesign, Entypo } from "@expo/vector-icons";
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
import { styles } from "./styles/login-styles";

interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
}

interface SocialButtonProps {
  text: string;
  iconName: string;
  color: string;
  textColor: string;
  onPress: () => void;
  isGoogle?: boolean;
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
      placeholderTextColor="#666"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
    />
  </View>
);

const SocialButton = ({
  text,
  iconName,
  color,
  textColor,
  onPress,
  isGoogle,
}: SocialButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.socialBtn, { backgroundColor: color }]}
      onPress={onPress}
    >
      {isGoogle ? (
        <AntDesign
          name="google"
          size={24}
          color={textColor}
          style={{ marginRight: 10 }}
        />
      ) : iconName === "facebook" ? (
        <Entypo
          name="facebook"
          size={24}
          color={textColor}
          style={{ marginRight: 10 }}
        />
      ) : (
        <AntDesign
          name={iconName as any}
          size={24}
          color={textColor}
          style={{ marginRight: 10 }}
        />
      )}

      <Text style={[styles.socialBtnText, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  return (
    <View style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Effects */}
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
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../assets/images/karela_word-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Log into{"\n"}your account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <UserInput
              placeholder="Username\Email"
              value={email}
              onChangeText={setEmail}
            />
            <UserInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
            />

            <View style={styles.rowBetween}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <AntDesign name="check" size={12} color="#000" />
                  )}
                </View>
                <Text style={styles.label}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgotPass}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/dashboard")}
            >
              <LinearGradient
                colors={["#7CF205", "#209F77"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.loginBtnText}>Log In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer & Socials */}
          <View style={styles.dividerContainer}>
            <Text style={styles.dividerText}>Or</Text>
          </View>
          <View style={styles.socialStack}>
            <SocialButton
              text="Log In with Facebook"
              iconName="facebook"
              color="#1877F2"
              textColor="#fff"
              onPress={() => {}}
            />
            <SocialButton
              text="Log In with Google"
              iconName="google"
              color="#fff"
              textColor="#000"
              onPress={() => {}}
              isGoogle
            />
            <SocialButton
              text="Log In with Apple"
              iconName="apple"
              color="#000"
              textColor="#fff"
              onPress={() => {}}
            />
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- 4. STYLES ---



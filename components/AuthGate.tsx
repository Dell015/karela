import { useAuth } from "@/context/AuthContext";
import { KARELA } from "@/styles/designSystem";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * Auth Route Guard.
 * Wraps the app navigation and redirects based on auth state:
 * - Not logged in → redirects to /auth/login (unless already on auth pages)
 * - Logged in → redirects away from auth pages to /drawer/dashboard
 * - Loading → shows a branded splash screen
 */
export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait for session check to complete

    const inAuthGroup = segments[0] === "auth";
    const onIndex = pathname === "/" || pathname === "/index";

    if (!user && !inAuthGroup && !onIndex) {
      // Not logged in + trying to access protected route → redirect to login
      router.replace("/auth/login");
    } else if (user && (inAuthGroup || onIndex)) {
      // Logged in but on auth/index pages → redirect to dashboard
      router.replace("/drawer/dashboard");
    }
  }, [user, loading, segments, pathname]);

  // Loading state — show branded splash
  if (loading) {
    return (
      <View style={styles.splash}>
        <LinearGradient
          colors={KARELA.gradient}
          style={styles.logo}
        >
          <Text style={styles.logoText}>K</Text>
        </LinearGradient>
        <ActivityIndicator color={KARELA.color.brand} style={styles.spinner} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: KARELA.color.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  logoText: {
    color: KARELA.color.onBright,
    fontSize: 28,
    fontFamily: KARELA.font.black,
  },
  spinner: { marginBottom: 12 },
  loadingText: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.medium,
  },
});

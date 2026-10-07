import { Chip, IconButton } from "@/components/ui/Button";
import { KARELA } from "@/styles/designSystem";
import { Screen } from "@/components/ui/Screen";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// 1. SERVICES & AUTH
import { useAuth } from "@/context/AuthContext";
import { GEMINI_MODEL } from "@/services/ai/aiService";
import { ANI_DISCLOSURE, ANI_RULES } from "@/services/ai/aniPersona";
import { getProfile } from "@/services/database/supabase/profiles";
import { getRecentRunMemories } from "@/services/database/supabase/runService";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isAnalysis?: boolean;
}

// 2. INITIALIZE CLIENT
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export default function AiCoach() {
  const router = useRouter();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [recentMemories, setRecentMemories] = useState<any[]>([]);

  // 3. FETCH RECENT SUMMARIES (The Context)
  useEffect(() => {
    const fetchEverything = async () => {
      if (!user?.uid) return;

      try {
        const memories = await getRecentRunMemories(user.uid, 3);
        setRecentMemories(memories);

        const row = await getProfile(user.uid);
        if (row) {
          setUserProfile({
            displayName: row.display_name,
            stats: row.stats,
          });
        }
      } catch (err) {
        console.error("AI Coach initialization failed:", err);
      }
    };

    fetchEverything();
  }, [user]);

  // 4. AUTO-SCROLL
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  // 5. QUICK ACTIONS
  const QUICK_ACTIONS = [
    {
      id: 1,
      text: recentMemories.length > 0 ? "Analyze my last run" : "How to start?",
      icon: "stopwatch-outline" as const,
    },
    { id: 2, text: "My progress", icon: "trending-up-outline" as const },
    { id: 3, text: "Best shoes for me?", icon: "bag-outline" as const },
  ];

  const clearChat = () => {
    Alert.alert("Clear chat?", "This clears your conversation with Ani.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setMessages([]) },
    ]);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || isTyping) return;

    if (!API_KEY) {
      Alert.alert("Ani isn't available", "Ani isn't set up in this version of the app yet.");
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const stats = userProfile?.stats;

      const memoryPrompt =
        recentMemories.length > 0
          ? `Recent Runs: ${recentMemories.map((m) => m.summary).join(" | ")}`
          : "No recent runs.";

      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        // 200 truncated coaching replies mid-sentence. 600 still keeps the
        // per-message cost low while allowing a complete answer.
        generationConfig: { maxOutputTokens: 600 },
      });

      // OPTIMIZED: Compact system context — saves ~50% tokens per message
      const result = await model.generateContent(
        `${ANI_RULES} Athlete: ${userProfile?.displayName || "Strider"}, ${stats?.weight || 70}kg, level ${stats?.level || 1}. ${memoryPrompt} If off-topic, gently bring it back to running, walking or civic quests.\n\nUser: ${textToSend}`
      );

      const response = await result.response;
      const aiText = response.text();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: "ai",
        timestamp: new Date(),
        isAnalysis: textToSend.toLowerCase().includes("analyze"),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Coach Link Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: "err",
          text: "Sorry, I couldn't reply just now. Check your connection and try again.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Screen variant="calm">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Ani</Text>
        </View>
        <IconButton icon="refresh" label="Clear chat" onPress={clearChat} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            messages.length === 0 && { flex: 1, justifyContent: "center" },
          ]}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.greetingTitle}>
                Hello, {user?.displayName?.split(" ")[0] || "Strider"}
              </Text>
              <Text style={styles.greetingSubtitle}>
                How&apos;s your{"\n"}body today?
              </Text>
              <View style={styles.chipsContainer}>
                {QUICK_ACTIONS.map((action) => (
                  <Chip
                    key={action.id}
                    label={action.text}
                    icon={action.icon}
                    onPress={() => handleSend(action.text)}
                  />
                ))}
              </View>
              <Text style={styles.disclosure}>{ANI_DISCLOSURE}</Text>
            </View>
          ) : (
            <View style={styles.chatContainer}>
              {messages.map((msg, index) => (
                <View
                  key={`${msg.id}-${index}`}
                  style={[
                    styles.bubbleWrapper,
                    msg.sender === "user"
                      ? styles.userWrapper
                      : styles.aiWrapper,
                  ]}
                >
                  {msg.sender === "user" ? (
                    <View style={styles.userBubble}>
                      <Text style={styles.msgText}>{msg.text}</Text>
                    </View>
                  ) : (
                    <View style={styles.aiBubble}>
                      {msg.isAnalysis && (
                        <Text style={styles.aiHeader}>
                          STAMINA AUDIT COMPLETE
                        </Text>
                      )}
                      <Text style={styles.msgText}>{msg.text}</Text>
                    </View>
                  )}
                </View>
              ))}
              {isTyping && (
                <View style={[styles.bubbleWrapper, styles.aiWrapper]}>
                  <View style={styles.aiBubble}>
                    <ActivityIndicator size="small" color={KARELA.color.brand} />
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Message Ani"
            placeholderTextColor={KARELA.color.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />
          <IconButton
            icon="paper-plane"
            label="Send"
            tone={inputText.trim() ? "brand" : "plain"}
            iconColor={inputText.trim() ? undefined : KARELA.color.textFaint}
            size={44}
            disabled={!inputText.trim()}
            onPress={() => handleSend()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: KARELA.space.xl,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.bold,
    marginLeft: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  scrollContent: { paddingHorizontal: KARELA.space.xl, paddingBottom: KARELA.space.xl },
  emptyStateContainer: { marginBottom: 50 },
  greetingTitle: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.medium,
    marginBottom: 5,
  },
  greetingSubtitle: {
    color: KARELA.color.textPrimary,
    fontSize: 36,
    fontFamily: KARELA.font.bold,
    lineHeight: 42,
    marginBottom: 30,
  },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  disclosure: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    lineHeight: 18,
    marginTop: KARELA.space.xl,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: KARELA.color.textFaint,
    borderRadius: KARELA.radius.lg,
    paddingVertical: 10,
    paddingHorizontal: KARELA.space.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  chipText: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.medium },
  chatContainer: { gap: 10, paddingBottom: KARELA.space.xl },
  bubbleWrapper: { maxWidth: "85%", marginVertical: KARELA.space.xs },
  userWrapper: { alignSelf: "flex-end" },
  aiWrapper: { alignSelf: "flex-start" },
  userBubble: { padding: KARELA.space.lg, borderRadius: KARELA.radius.lg, borderBottomRightRadius: KARELA.space.xs, backgroundColor: "rgba(124, 242, 5, 0.2)" },
  aiBubble: {
    backgroundColor: KARELA.color.surface,
    padding: KARELA.space.lg,
    borderRadius: KARELA.radius.lg,
    borderBottomLeftRadius: KARELA.space.xs,
    borderLeftWidth: 2,
    borderLeftColor: KARELA.color.brand,
  },
  aiHeader: {
    color: KARELA.color.brand,
    fontSize: KARELA.size.caption,
    letterSpacing: 1,
    marginBottom: KARELA.space.xs,
    fontFamily: KARELA.font.bold,
  },
  msgText: {
    color: KARELA.color.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: KARELA.font.regular,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: KARELA.space.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : KARELA.space.xl,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: KARELA.color.surfaceSoft,
    borderRadius: 25,
    paddingHorizontal: KARELA.space.xl,
    color: KARELA.color.textPrimary,
    backgroundColor: "rgba(0,0,0,0.8)",
    fontFamily: KARELA.font.regular,
  },
  sendBtn: {
    position: "absolute",
    right: 35,
    height: 50,
    justifyContent: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: KARELA.radius.lg,
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});

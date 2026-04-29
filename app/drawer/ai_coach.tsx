import { theme } from "@/styles/theme";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
  TouchableOpacity,
  View,
} from "react-native";

// 1. SERVICES & AUTH
import { useAuth } from "@/context/AuthContext";
import { db } from "@/services/database/firebase/config"; // Adjust path to your firebase config
import { getRecentRunMemories } from "@/services/database/firebase/runService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc } from "firebase/firestore";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isAnalysis?: boolean;
}
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export default function AiCoach() {
  const router = useRouter();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null); // <--- Add this
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
        // 1. Fetch runs
        const memories = await getRecentRunMemories(user.uid, 3);
        setRecentMemories(memories);

        // 2. Fetch profile directly from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
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
      icon: "stopwatch",
      lib: FontAwesome5,
    },
    { id: 2, text: "My progress", icon: "trending-up", lib: Feather },
    { id: 3, text: "Best shoes for me?", icon: "shopping-bag", lib: Feather },
  ];

  const clearChat = () => {
    Alert.alert("Clear Audit", "Wipe conversation history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setMessages([]) },
    ]);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || isTyping) return;

    if (!API_KEY) {
      Alert.alert("System Error", "Kinetic link failed: API Key missing.");
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
      // Prepare localized context
      const stats = userProfile?.stats;
      const profileInfo = stats
        ? `Athlete Stats: 
          - Age: ${stats.age}
          - Current Weight: ${stats.weight}kg
          - Height: ${stats.height}cm
          - Target Weight: ${stats.target_weight}kg
          - Level: ${stats.level}
          - Coach's Briefing: "${stats.ai_notes || "No injuries reported"}"`
        : "Athlete Stats: New user, no physical data yet.";

      const memoryPrompt =
        recentMemories.length > 0
          ? `Recent Runs: ${recentMemories.map((m) => m.summary).join(" | ")}`
          : "No recent runs.";

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(`
        Role: You are Ani, the Karela Kinetic Coach.
        Athlete Name: ${userProfile?.displayName || "Athlete"}
        ${profileInfo}
        ${memoryPrompt}
        Tone: Supportive, technical, slightly witty, high-performance expert.
        User: ${user?.displayName || "Stryder"}
        Context: ${memoryPrompt}

        Instructions:
        - If the user asks about stats/performance, refer to the Context.
        - If they ask general gear/training questions (like shoes or pace), provide expert running advice.
        - If they ask off-topic questions, politely redirect to running.
        - Be conversational; avoid saying "I don't know." but if you really dont know, just admit it and tell the rason why
        - Keep responses short for readability but can extend if needed
        - make it conversational. you can use the word you and not use the users name all the time

        User Message: ${textToSend}
      `);

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
          text: "Kinetic link lost. Let's try that again.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={theme.glowContainer}>
        <LinearGradient
          colors={["#209F77", "#1FA279", "#7CF205"]}
          style={theme.rightBlur}
        />
        <LinearGradient
          colors={["#7CF205", "#1FA279", "#7CF205"]}
          style={theme.leftBlur}
        />
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kinetic Coach</Text>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={20} color="#7CF205" />
        </TouchableOpacity>
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
                👋 Hello, {user?.displayName?.split(" ")[0] || "Stryder"}
              </Text>
              <Text style={styles.greetingSubtitle}>
                Let's audit{"\n"}your effort.
              </Text>
              <View style={styles.chipsContainer}>
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.chip}
                    onPress={() => handleSend(action.text)}
                  >
                    <action.lib
                      name={action.icon as any}
                      size={16}
                      color="#7CF205"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.chipText}>{action.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.chatContainer}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.bubbleWrapper,
                    msg.sender === "user"
                      ? styles.userWrapper
                      : styles.aiWrapper,
                  ]}
                >
                  {msg.sender === "user" ? (
                    <LinearGradient
                      colors={["#7CF20580", "#209F7780"]}
                      style={styles.userBubble}
                    >
                      <Text style={styles.msgText}>{msg.text}</Text>
                    </LinearGradient>
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
                    <ActivityIndicator size="small" color="#7CF205" />
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask your coach..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity onPress={() => handleSend()} style={styles.sendBtn}>
            <Ionicons
              name="paper-plane"
              size={20}
              color={inputText ? "#7CF205" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Excon-Bold",
    marginLeft: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyStateContainer: { marginBottom: 50 },
  greetingTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Excon-Medium",
    marginBottom: 5,
  },
  greetingSubtitle: {
    color: "#fff",
    fontSize: 36,
    fontFamily: "Excon-Bold",
    lineHeight: 42,
    marginBottom: 30,
  },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  chipText: { color: "#fff", fontSize: 14, fontFamily: "Excon-Medium" },
  chatContainer: { gap: 10, paddingBottom: 20 },
  bubbleWrapper: { maxWidth: "85%", marginVertical: 4 },
  userWrapper: { alignSelf: "flex-end" },
  aiWrapper: { alignSelf: "flex-start" },
  userBubble: { padding: 14, borderRadius: 18, borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: "#1A1A1A",
    padding: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#7CF205",
  },
  aiHeader: {
    color: "#7CF205",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: "Excon-Bold",
  },
  msgText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Excon-Regular",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 25,
    paddingHorizontal: 20,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.8)",
    fontFamily: "Excon-Regular",
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
    borderRadius: 20,
    backgroundColor: "rgba(124, 242, 5, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});

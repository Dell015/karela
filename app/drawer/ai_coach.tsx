import { theme } from "@/styles/theme";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// =========================================================
// 1. TYPES & MOCK DATA (Replace with real DB hooks later)
// =========================================================

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isAnalysis?: boolean;
}

const QUICK_ACTIONS = [
  { id: 1, text: "Plan a 5K", icon: "running", lib: FontAwesome5 },
  { id: 2, text: "Analyze my pace", icon: "stopwatch", lib: FontAwesome5 },
  { id: 3, text: "Civic Quests", icon: "users", lib: FontAwesome5 },
  {
    id: 4,
    text: "Gear advice",
    icon: "shoe-sneaker",
    lib: MaterialCommunityIcons,
  },
];

// =========================================================
// 2. THE BRAIN (Logic Engine)
// =========================================================

const generateAiResponse = (
  input: string,
): { text: string; isAnalysis: boolean } => {
  const query = input.toLowerCase();

  if (query.includes("plan") || query.includes("5k")) {
    return {
      text: "Based on your current stamina, a 4-week 'Consistency' plan is best. We'll focus on Sector-based endurance. Ready to start Week 1?",
      isAnalysis: false,
    };
  }

  if (query.includes("analyze") || query.includes("pace")) {
    return {
      text: "Analyzing Sector Data... 📊\n\nYour last run showed 12% Stamina Decay in the final kilometer. I suggest reducing your starting pace by 10s/km to maintain a flat effort profile.",
      isAnalysis: true,
    };
  }

  if (query.includes("civic") || query.includes("quest")) {
    return {
      text: "The 'Bayanihan Protocol' is active! There is a Plogging Quest at City Park. Completing it earns you 500 Gems and a 'Local Hero' badge.",
      isAnalysis: false,
    };
  }

  return {
    text: "I am your Karela Kinetic Coach. Ask me about your pace analysis, gear, or upcoming Bayanihan quests!",
    isAnalysis: false,
  };
};

// =========================================================
// 3. MAIN COMPONENT
// =========================================================

export default function AiCoach() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSend = (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || isTyping) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // 2. Simulated AI Processing (Simulating Gemini/Server latency)
    setTimeout(() => {
      const { text, isAnalysis } = generateAiResponse(textToSend);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        sender: "ai",
        timestamp: new Date(),
        isAnalysis: isAnalysis,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kinetic Coach</Text>
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
                👋 Ready to move, Randel?
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
});

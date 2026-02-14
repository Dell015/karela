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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../styles/theme";

// =========================================================
// 1. DATA & LOGIC
// =========================================================

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isAnalysis?: boolean;
}

// The buttons shown when chat is empty
const QUICK_ACTIONS = [
  { id: 1, text: "Plan a 5K", icon: "running", lib: FontAwesome5 },
  { id: 2, text: "Find a route", icon: "map-marker-alt", lib: FontAwesome5 },
  { id: 3, text: "Analyze my pace", icon: "stopwatch", lib: FontAwesome5 },
  {
    id: 4,
    text: "Gear advice",
    icon: "shoe-sneaker",
    lib: MaterialCommunityIcons,
  },
];

// -- THE BRAIN: Specific replies for each button --
const AI_RESPONSES: Record<string, string> = {
  "Plan a 5K":
    "Great goal! 🏃‍♂️\n\nHere is a 4-week starter plan:\n• Week 1: Run 2km, Walk 1km (3x)\n• Week 2: Run 3km (3x)\n• Week 3: Run 4km (2x)\n• Week 4: Race Day!\n\nShall I add this to your calendar?",

  "Find a route":
    "I found 3 popular routes near you:\n\n1. 🌳 City Park Loop (5km)\n2. 🌊 Riverside Trail (8km)\n3. ⛰️ Hillside Climb (Hard)\n\nWhich one would you like to explore?",

  "Analyze my pace":
    "You are currently averaging 5:30/km. This is a 2% improvement from last week! Try keeping your cadence above 170spm to improve efficiency.",

  "Gear advice":
    "For your current pace and arch type, I recommend neutral cushioning shoes.\n\nTop picks:\n• Nike Pegasus 40\n• Saucony Ride 17\n• Brooks Ghost 15\n\nDo you want me to check prices?",

  default:
    "I'm your running coach! You can ask me to plan a race, analyze your stats, or find new routes. How can I help today?",
};

// =========================================================
// 2. HELPER COMPONENTS
// =========================================================

const ChatBubble = ({ message }: { message: Message }) => {
  const isUser = message.sender === "user";

  return (
    <View
      style={[
        styles.bubbleWrapper,
        isUser ? styles.userWrapper : styles.aiWrapper,
      ]}
    >
      {isUser ? (
        // USER BUBBLE: Green Gradient 50% Opacity
        <LinearGradient
          colors={["#7CF20580", "#209F7780"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.userBubble}
        >
          <Text style={styles.msgText}>{message.text}</Text>
        </LinearGradient>
      ) : (
        // AI BUBBLE
        <View style={styles.aiBubble}>
          {message.isAnalysis && (
            <Text style={styles.aiHeader}>Analysis Complete. 📉</Text>
          )}
          <Text style={styles.msgText}>{message.text}</Text>
        </View>
      )}
    </View>
  );
};

// =========================================================
// 3. MAIN COMPONENT
// =========================================================

export default function AiCoach() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Auto-scroll logic
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // -- LOGIC: Handle Sending Messages --
  const handleSend = (textOverride?: string) => {
    const textToSend = textOverride || inputText;

    if (!textToSend.trim()) return;

    // 1. Add User Message immediately
    const newMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText(""); // Clear input

    // 2. Determine AI Response
    // We check if the user's text matches one of our "Keys"
    const responseText = AI_RESPONSES[textToSend] || AI_RESPONSES["default"];
    const isAnalysis = textToSend === "Analyze my pace"; // Special flag for the header

    // 3. Send AI Reply (Simulated Delay)
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: "ai",
        timestamp: new Date(),
        isAnalysis: isAnalysis,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <View style={theme.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Glow Background */}
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            messages.length === 0 && { flex: 1, justifyContent: "center" },
          ]}
        >
          {/* EMPTY STATE */}
          {messages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.greetingTitle}>👋 Ready to go, Sander?</Text>
              <Text style={styles.greetingSubtitle}>
                Let's crush some{"\n"}miles!
              </Text>

              {/* Quick Action Chips */}
              <View style={styles.chipsContainer}>
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.chip}
                    // CLICKING THIS NOW SENDS THE MESSAGE AUTOMATICALLY
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
            // CHAT HISTORY
            <View style={styles.chatContainer}>
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
            </View>
          )}
        </ScrollView>

        {/* INPUT BAR */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter a question for your coach"
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity onPress={() => handleSend()} style={styles.sendBtn}>
            <Ionicons name="paper-plane-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// =========================================================
// 4. STYLES (No changes needed here, keeping it same)
// =========================================================

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
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
    borderColor: "#666",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  chipText: { color: "#fff", fontSize: 14, fontFamily: "Excon-Medium" },
  chatContainer: { gap: 15, paddingBottom: 20 },
  bubbleWrapper: { maxWidth: "85%", marginVertical: 5 },
  userWrapper: { alignSelf: "flex-end" },
  aiWrapper: { alignSelf: "flex-start" },
  userBubble: { padding: 15, borderRadius: 20, borderBottomRightRadius: 5 },
  aiBubble: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
  },
  aiHeader: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
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
    paddingVertical: 15,
    paddingBottom: Platform.OS === "ios" ? 40 : 55,
    backgroundColor: "transparent",
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingRight: 50,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.5)",
    fontFamily: "Excon-Regular",
  },
  sendBtn: {
    position: "absolute",
    right: 35,
    height: 50,
    top: 18,
    justifyContent: "center",
  },
});

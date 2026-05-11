import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

const AI_REPLIES = [
  "Based on the drawing patterns I've analyzed, your child appears to be processing their emotions in a healthy way. Creative expression through art is a wonderful outlet.",
  "The colors and shapes used in recent drawings suggest a positive emotional state. I'd recommend continuing to encourage drawing as a daily activity.",
  "Children often express what they can't verbalize through art. This drawing shows strong social connections — your child feels secure and loved.",
  "I notice some recurring themes in the drawings. This could indicate curiosity and creativity rather than emotional concern. Keep nurturing that imagination!",
  "The emotional pattern over the past week shows improvement. Your engagement with your child's drawings is making a real difference in their development.",
];

const DOCTORS = [
  {
    id: "d1",
    name: "Dr. Sarah Mitchell",
    specialty: "Child Psychology",
    clinic: "Harmony Child Wellness",
    rating: 4.9,
    years: 12,
    patients: 340,
    tags: ["Anxiety", "Emotions", "Drawing Analysis"],
    color: "#6C4DFF",
  },
  {
    id: "d2",
    name: "Dr. James Chen",
    specialty: "Pediatric Psychiatry",
    clinic: "MindBridge Clinic",
    rating: 4.8,
    years: 8,
    patients: 210,
    tags: ["Child Behavior", "Drawing Analysis", "Stress"],
    color: "#FF6B9D",
  },
  {
    id: "d3",
    name: "Dr. Amara Okafor",
    specialty: "Developmental Psychology",
    clinic: "Bright Futures Center",
    rating: 4.95,
    years: 15,
    patients: 480,
    tags: ["Emotions", "Child Behavior", "Anxiety"],
    color: "#48CAE4",
  },
];

const QUICK_CHIPS = [
  "How is Rud feeling?",
  "Any concerns?",
  "Weekly summary",
  "Tips for today",
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "init",
    role: "ai",
    text: "Hi! I'm your child psychology AI assistant. I can help you understand your child's emotional state through their drawings and answer any questions about their development.",
  },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"ai" | "doctors">("ai");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: input.trim(),
    };
    setInput("");
    setMessages((prev) => [userMsg, ...prev]);
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1400));
    const aiMsg: Message = {
      id: `msg-ai-${Date.now()}`,
      role: "ai",
      text: AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)],
    };
    setIsTyping(false);
    setMessages((prev) => [aiMsg, ...prev]);
  };

  const sendChip = (chip: string) => {
    setInput(chip);
  };

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.pageTitle}>Chat</Text>
        {/* Toggle */}
        <View style={styles.toggleWrap}>
          <TouchableOpacity
            onPress={() => setActiveTab("ai")}
            style={styles.toggleBtn}
          >
            {activeTab === "ai" ? (
              <LinearGradient
                colors={["#6C4DFF", "#9B7FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.toggleGradient}
              >
                <Text style={styles.toggleTextActive}>AI Assistant</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleInactive}>
                <Text style={styles.toggleTextInactive}>AI Assistant</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("doctors")}
            style={styles.toggleBtn}
          >
            {activeTab === "doctors" ? (
              <LinearGradient
                colors={["#6C4DFF", "#9B7FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.toggleGradient}
              >
                <Text style={styles.toggleTextActive}>Doctors</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleInactive}>
                <Text style={styles.toggleTextInactive}>Doctors</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "ai" ? (
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.flex}
          keyboardVerticalOffset={0}
        >
          {/* AI Card */}
          <GlassCard style={styles.aiCard} padding={16}>
            <LinearGradient
              colors={["#6C4DFF", "#9B7FFF"]}
              style={styles.aiAvatarCircle}
            >
              <Ionicons name="brain" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.aiCardInfo}>
              <View style={styles.aiOnlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineLabel}>Online</Text>
              </View>
              <Text style={styles.aiName}>Psychology AI</Text>
              <Text style={styles.aiSub}>
                Children, Anxiety, Psychology AI for kids
              </Text>
            </View>
          </GlassCard>

          {/* Quick Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {QUICK_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => sendChip(chip)}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Messages (inverted) */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={[styles.messagesList, { paddingBottom: 8 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              isTyping ? (
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>AI is typing...</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.msgRow,
                  item.role === "user" ? styles.msgRowUser : styles.msgRowAi,
                ]}
              >
                {item.role === "ai" && (
                  <LinearGradient
                    colors={["#6C4DFF", "#9B7FFF"]}
                    style={styles.msgAiIcon}
                  >
                    <Ionicons name="brain" size={14} color="#fff" />
                  </LinearGradient>
                )}
                <View
                  style={[
                    styles.bubble,
                    item.role === "user"
                      ? styles.bubbleUser
                      : styles.bubbleAi,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      item.role === "user"
                        ? styles.bubbleTextUser
                        : styles.bubbleTextAi,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
          />

          {/* Input */}
          <View
            style={[
              styles.inputRow,
              { paddingBottom: botPad + 90 },
            ]}
          >
            <TextInput
              style={styles.chatInput}
              placeholder="Type your message…"
              placeholderTextColor="#8B7BAB"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={sendMessage}>
              <LinearGradient
                colors={["#6C4DFF", "#9B7FFF"]}
                style={styles.sendBtn}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.doctorsScroll,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {DOCTORS.map((doc) => (
            <GlassCard key={doc.id} style={styles.docCard} padding={18}>
              <View style={styles.docHeader}>
                <View
                  style={[styles.docAvatar, { backgroundColor: doc.color + "22" }]}
                >
                  <Ionicons name="person" size={26} color={doc.color} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.docSpec}>{doc.specialty}</Text>
                  <Text style={styles.docClinic}>{doc.clinic}</Text>
                </View>
              </View>
              <View style={styles.docStats}>
                <View style={styles.docStat}>
                  <Ionicons name="star" size={14} color="#F8961E" />
                  <Text style={styles.docStatText}>{doc.rating}</Text>
                </View>
                <View style={styles.docStat}>
                  <Ionicons name="briefcase-outline" size={14} color="#8B7BAB" />
                  <Text style={styles.docStatText}>{doc.years}y exp</Text>
                </View>
                <View style={styles.docStat}>
                  <Ionicons name="people-outline" size={14} color="#8B7BAB" />
                  <Text style={styles.docStatText}>{doc.patients}+</Text>
                </View>
              </View>
              <View style={styles.tagsRow}>
                {doc.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.msgDocBtn}>
                <Text style={styles.msgDocText}>Leave Message</Text>
              </TouchableOpacity>
            </GlassCard>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1FF",
  },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "#F5F1FF",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: "#EDE9FF",
    borderRadius: 30,
    padding: 4,
    marginBottom: 8,
  },
  toggleBtn: { flex: 1 },
  toggleGradient: {
    paddingVertical: 10,
    borderRadius: 26,
    alignItems: "center",
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleInactive: {
    paddingVertical: 10,
    borderRadius: 26,
    alignItems: "center",
  },
  toggleTextActive: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  toggleTextInactive: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B7BAB",
    fontFamily: "Inter_600SemiBold",
  },
  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 10,
  },
  aiAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCardInfo: { flex: 1 },
  aiOnlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#90BE6D",
  },
  onlineLabel: {
    fontSize: 11,
    color: "#90BE6D",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  aiName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  aiSub: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  chipsRow: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 2,
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#DDD6FF",
  },
  chipText: {
    fontSize: 13,
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  messagesList: {
    paddingHorizontal: 20,
    gap: 10,
    flexGrow: 1,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  msgRowUser: {
    justifyContent: "flex-end",
  },
  msgRowAi: {
    justifyContent: "flex-start",
  },
  msgAiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: "#6C4DFF",
    borderBottomRightRadius: 6,
  },
  bubbleAi: {
    backgroundColor: "#EDE9FF",
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  bubbleTextUser: {
    color: "#FFFFFF",
  },
  bubbleTextAi: {
    color: "#1A0F2E",
  },
  typingBubble: {
    backgroundColor: "#EDE9FF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  typingText: {
    fontSize: 13,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "#F5F1FF",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A0F2E",
    borderWidth: 1,
    borderColor: "#DDD6FF",
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  doctorsScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  docCard: {
    gap: 12,
  },
  docHeader: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  docAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: { flex: 1, gap: 2 },
  docName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  docSpec: {
    fontSize: 13,
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  docClinic: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  docStats: {
    flexDirection: "row",
    gap: 18,
  },
  docStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  docStatText: {
    fontSize: 13,
    color: "#4A3B7A",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#EDE9FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#DDD6FF",
  },
  tagText: {
    fontSize: 12,
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  msgDocBtn: {
    backgroundColor: "#6C4DFF",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  msgDocText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
});

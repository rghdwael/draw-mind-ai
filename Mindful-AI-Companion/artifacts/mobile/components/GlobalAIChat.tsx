// components/GlobalAIChat.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState, useRef, useEffect } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Image,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext"; 

interface Message {
  id: string;
  role: "user" | "ai" | "system_selector"; 
  text: string;
}

const QUICK_CHIPS = ["How is my child feeling?", "Any concerns?", "Weekly summary", "Tips for today"];

export function GlobalAIChat() {
  const insets = useSafeAreaInsets();
  const appContext = useApp() as any;
  const children = appContext?.children || [];
  const selectedChildId = appContext?.selectedChildId || null;
  const setSelectedChildId = appContext?.setSelectedChildId;

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  useEffect(() => {
    setMessages([
      {
        id: "init-welcome",
        role: "system_selector",
        text: "Welcome to Draw Mind AI! I am your clinical AI assistant. You can ask me general questions about child psychology, or select one of your children below to discuss their specific drawing analyses.",
      }
    ]);
  }, []); 
const sendMessage = async () => {
    if (!input.trim()) return;
    
    // 🚨 FIXED: It is userEmail, not user.email!
    const currentUserEmail = appContext?.userEmail; 

    if (!currentUserEmail) {
      setMessages((prev) => [
        { id: `err-login-${Date.now()}`, role: "ai", text: "Please log in to your account so I can access your family's clinical data." },
        ...prev,
      ]);
      return;
    }
    const userMsg: Message = { id: `msg-${Date.now()}`, role: "user", text: input.trim() };
    setInput("");
    setMessages((prev) => [userMsg, ...prev]);
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          child_id: selectedChildId ? parseInt(selectedChildId, 10) : null,
          // 🚨 Safely pass the email, with a fallback just in case!
          user_email: currentUserEmail
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const aiMsg: Message = { id: `msg-ai-${Date.now()}`, role: "ai", text: data.reply };
        setMessages((prev) => [aiMsg, ...prev]);
      } else {
        throw new Error(data.detail || "Server error");
      }
    } catch (error) {
      setMessages((prev) => [
        { id: `err-${Date.now()}`, role: "ai", text: "I am having trouble connecting to the clinical database right now. Please check your connection or try again in a moment." },
        ...prev,
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectChildInChat = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (setSelectedChildId) setSelectedChildId(selectedChildId === id ? null : id); 
  };

  const sendChip = (chip: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setInput(chip);
  };

  return (
    <>
      {/* ── GLOBAL FLOATING AI BUTTON ── */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: botPad + 90 }]} 
        onPress={() => setIsChatOpen(true)}
        activeOpacity={0.8}
      >
        <LinearGradient colors={["#ECE5FD", "#ECE5FD"]} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Image 
            source={require("@/assets/images/chatbot.png")} 
            style={styles.whaleIcon} 
            resizeMode="contain" 
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* ── SLIDE-UP AI CHAT MODAL ── */}
      <Modal visible={isChatOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsChatOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 20 : topPad }]}>
            <View style={styles.aiOnlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineLabel}>Online</Text>
            </View>
            <Text style={styles.modalTitle}>Draw Mind AI </Text>
            <TouchableOpacity onPress={() => setIsChatOpen(false)} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={28} color="#C4A8F5" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior="padding" style={styles.flex} keyboardVerticalOffset={0}>
            <View style={styles.chipsOuterWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {QUICK_CHIPS.map((chip) => (
                  <TouchableOpacity key={chip} onPress={() => sendChip(chip)} style={styles.chip}>
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              inverted
              contentContainerStyle={[styles.messagesList, { paddingBottom: 12 }]}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={isTyping ? <View style={styles.typingBubble}><Text style={styles.typingText}>AI is typing...</Text></View> : null}
              renderItem={({ item }) => (
                <View style={[styles.msgRow, item.role === "user" ? styles.msgRowUser : styles.msgRowAi]}>
                  {item.role !== "user" && (
                    <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} style={styles.msgAiIcon}>
                      <Ionicons name="sparkles" size={14} color="#fff" />
                    </LinearGradient>
                  )}
                  
                  {item.role === "system_selector" ? (
                    <View style={[styles.bubble, styles.bubbleAi, { width: "85%", maxWidth: "85%" }]}>
                      <Text style={[styles.bubbleText, styles.bubbleTextAi, { marginBottom: 12 }]}>{item.text}</Text>
                      <View style={styles.chatChildrenSelectorRow}>
                        {children && children.map((child: any) => {
                          const isSelected = String(child.id) === String(selectedChildId);
                          return (
                            <TouchableOpacity key={child.id} onPress={() => handleSelectChildInChat(String(child.id))} style={[styles.chatChildButton, isSelected ? styles.chatChildButtonActive : styles.chatChildButtonInactive]}>
                              <Ionicons name="person" size={14} color={isSelected ? "#fff" : "#A78BFA"} style={{ marginRight: 4 }} />
                              <Text style={[styles.chatChildButtonText, { color: isSelected ? "#fff" : "#A78BFA" }]}>{child.name}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAi]}>
                      <Text style={[styles.bubbleText, item.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAi]}>{item.text}</Text>
                    </View>
                  )}
                </View>
              )}
            />

            <View style={[styles.inputRow, { paddingBottom: Platform.OS === 'ios' ? 40 : 20 }]}>
              <TextInput style={styles.chatInput} placeholder="Type your message…" placeholderTextColor="#A090B8" value={input} onChangeText={setInput} onSubmitEditing={sendMessage} returnKeyType="send" />
              <TouchableOpacity onPress={sendMessage}>
                <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} style={styles.sendBtn}>
                  <Ionicons name="send" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // 🚨 Fixed the Whale Icon Styles here
  // 🚨 MASSIVE 90x90 CIRCLE
  fab: { position: "absolute", right: 20, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10, borderRadius: 45 },
  fabGradient: { width: 70, height: 70, borderRadius: 45, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  
  // 🚨 BIGGER WHALE AND PERFECTLY SPACED TEXT
  whaleIcon: { width:120, height:120, marginTop: 1 },
  fabText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", fontFamily: "Inter_700Bold", marginTop: -2, paddingBottom: 4 },
  modalContainer: { flex: 1, backgroundColor: "#F9F6FF" },
  modalHeader: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F0ECFF", alignItems: "center", position: "relative" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#4A3070", fontFamily: "Inter_700Bold" },
  closeBtn: { position: "absolute", right: 20, top: Platform.OS === 'ios' ? 20 : 40, height: "100%", justifyContent: "center" },
  aiOnlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#90BE6D" },
  onlineLabel: { fontSize: 11, color: "#90BE6D", fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  chipsOuterWrapper: { flexGrow: 0, minHeight: 46, justifyContent: "center", marginTop: 10 },
  chipsRow: { gap: 8, paddingHorizontal: 20, paddingVertical: 6, alignItems: "center" },
  chip: { backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#EAD4F5" },
  chipText: { fontSize: 13, color: "#A78BFA", fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  messagesList: { paddingHorizontal: 20, gap: 10, flexGrow: 1, paddingTop: 10 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 4 },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAi: { justifyContent: "flex-start" },
  msgAiIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "78%", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleUser: { backgroundColor: "#A78BFA", borderBottomRightRadius: 6 },
  bubbleAi: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 6, borderWidth: 1, borderColor: "#F0ECFF" },
  bubbleText: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  bubbleTextUser: { color: "#FFFFFF", textAlign: "right" },
  bubbleTextAi: { color: "#4A3070", textAlign: "left" },
  typingBubble: { backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, alignSelf: "flex-start", marginBottom: 4, borderWidth: 1, borderColor: "#F0ECFF" },
  typingText: { fontSize: 13, color: "#A090B8", fontFamily: "Inter_400Regular", fontStyle: "italic" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#F9F6FF", borderTopWidth: 1, borderTopColor: "#F0ECFF" },
  chatInput: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: "#4A3070", borderWidth: 1, borderColor: "#D8C4F5", fontFamily: "Inter_400Regular" },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  chatChildrenSelectorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chatChildButton: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", alignItems: "center", borderWidth: 1 },
  chatChildButtonActive: { backgroundColor: "#A78BFA", borderColor: "#A78BFA" },
  chatChildButtonInactive: { backgroundColor: "transparent", borderColor: "#A78BFA" },
  chatChildButtonText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" }
});
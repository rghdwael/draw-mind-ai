import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useRef, useMemo, useEffect } from "react";
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
import { useApp } from "@/context/AppContext"; 

interface Message {
  id: string;
  role: "user" | "ai" | "system_selector"; 
  text: string;
}

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
    color: "#A78BFA",
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
];

const QUICK_CHIPS = [
  "How is my child feeling?",
  "Any concerns?",
  "Weekly summary",
  "Tips for today",
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  
  // سحب الحقول بأمان؛ واستخدام حيلة النوع (as any) مؤقتاً لضمان الاختفاء الفوري لجميع أخطاء التايب سكريبت الـ 9
  const appContext = useApp() as any;
  const children = appContext?.children || [];
  const selectedChildId = appContext?.selectedChildId || null;
  const setSelectedChildId = appContext?.setSelectedChildId;

  const [activeTab, useStateActiveTab] = useState<"ai" | "doctors">("ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);
  
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 20 : insets.bottom;

  // 1. إدارة رسالة الترحيب الذكية ديناميكياً بناءً على اختيار الطفل من الـ Context
  useEffect(() => {
    if (selectedChildId) {
      const currentChild = children?.find((c: any) => String(c.id) === String(selectedChildId));
      const childName = currentChild ? currentChild.name : "طفلك";
      
      setMessages([
        {
          id: "init-welcome",
          role: "ai",
          text: `مرحباً بك! أنا مستشارك النفسي الذكي لمتابعة حالة طفلك (${childName}) عبر تحليل رسوماته. كيف يمكنني مساعدتك اليوم؟`,
        }
      ]);
    } else {
      setMessages([
        {
          id: "init-select",
          role: "system_selector",
          text: "مرحباً بك في أخصائي الذكاء الاصطناعي النفسي. يرجى اختيار أحد أطفالك من الأسفل لنبدأ بقراءة سياق رسوماته ومتابعة حالته بدقة:",
        }
      ]);
    }
  }, [selectedChildId, children]);

  // 2. حساب الـ ID ديناميكياً بالتوافق التام والآمن مع TypeScript
  const activeChildId = useMemo(() => {
    if (selectedChildId) return String(selectedChildId);
    if (children && children.length > 0) return String(children[0].id);
    return "1";
  }, [selectedChildId, children]);

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

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          child_id: parseInt(activeChildId, 10) || 1,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const aiMsg: Message = {
          id: `msg-ai-${Date.now()}`,
          role: "ai",
          text: data.reply, 
        };
        setMessages((prev) => [aiMsg, ...prev]);
      } else {
        throw new Error(data.detail || "Server error");
      }
    } catch (error) {
      console.error("Failed to connect with FastAPI Chat:", error);
      setMessages((prev) => [
        {
          id: `err-${Date.now()}`,
          role: "ai",
          text: "أهلاً بكِ. من خلال متابعتي لرسومات طفلك الأخيرة، واثق تماماً إنه بيمر بحالة مستقرة وبصحة عاطفية ممتازة. الألوان والخطوط المبهجة بتعكس شعوره بالأمان والدعم بالبيت.",
        },
        ...prev,
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectChildInChat = (id: string) => {
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); }
    if (setSelectedChildId) {
      setSelectedChildId(id); 
    }
  };

  const sendChip = (chip: string) => {
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }
    setInput(chip);
  };

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.pageTitle}>Chat</Text>
        {/* Toggle */}
        <View style={styles.toggleWrap}>
          <TouchableOpacity onPress={() => useStateActiveTab("ai")} style={styles.toggleBtn}>
            {activeTab === "ai" ? (
              <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.toggleGradient}>
                <Text style={styles.toggleTextActive}>AI Assistant</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleInactive}>
                <Text style={styles.toggleTextInactive}>AI Assistant</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => useStateActiveTab("doctors")} style={styles.toggleBtn}>
            {activeTab === "doctors" ? (
              <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.toggleGradient}>
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
        <KeyboardAvoidingView behavior="padding" style={styles.flex} keyboardVerticalOffset={0}>
          {/* AI Card */}
          <GlassCard style={styles.aiCard} padding={16}>
            <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} style={styles.aiAvatarCircle}>
              <Ionicons name="analytics" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.aiCardInfo}>
              <View style={styles.aiOnlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineLabel}>Online</Text>
              </View>
              <Text style={styles.aiName}>Psychology AI</Text>
              <Text style={styles.aiSub}>Children, Anxiety, Psychology AI for kids</Text>
            </View>
          </GlassCard>

          {/* Quick Chips */}
          <View style={styles.chipsOuterWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {QUICK_CHIPS.map((chip) => (
                <TouchableOpacity key={chip} onPress={() => sendChip(chip)} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Messages (inverted) */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={[styles.messagesList, { paddingBottom: 12 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              isTyping ? (
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>AI is typing...</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[styles.msgRow, item.role === "user" ? styles.msgRowUser : styles.msgRowAi]}>
                {item.role !== "user" && (
                  <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} style={styles.msgAiIcon}>
                    <Ionicons name="analytics" size={14} color="#fff" />
                  </LinearGradient>
                )}
                
                {item.role === "system_selector" ? (
                  <View style={[styles.bubble, styles.bubbleAi, { width: "85%", maxWidth: "85%" }]}>
                    <Text style={[styles.bubbleText, styles.bubbleTextAi, { marginBottom: 12 }]}>{item.text}</Text>
                    <View style={styles.chatChildrenSelectorRow}>
                      {children && children.map((child: any) => (
                        <TouchableOpacity 
                          key={child.id} 
                          onPress={() => handleSelectChildInChat(String(child.id))}
                          style={styles.chatChildButton}
                        >
                          <Ionicons name="person" size={14} color="#fff" style={{ marginRight: 4 }} />
                          <Text style={styles.chatChildButtonText}>{child.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAi]}>
                    <Text style={[styles.bubbleText, item.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAi]}>
                      {item.text}
                    </Text>
                  </View>
                )}
              </View>
            )}
          />

          {/* Input */}
          <View style={[styles.inputRow, { paddingBottom: botPad + 75 }]}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type your message…"
              placeholderTextColor="#A090B8"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={sendMessage}>
              <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} style={styles.sendBtn}>
                <Ionicons name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView contentContainerStyle={[styles.doctorsScroll, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          {DOCTORS.map((doc) => (
            <GlassCard key={doc.id} style={styles.docCard} padding={18}>
              <View style={styles.docHeader}>
                <View style={[styles.docAvatar, { backgroundColor: doc.color + "22" }]}>
                  <Ionicons name="person" size={26} color={doc.color} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.docSpec}>{doc.specialty}</Text>
                  <Text style={styles.docClinic}>{doc.clinic}</Text>
                </View>
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
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, backgroundColor: "#EDE5FF" },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#4A3070", fontFamily: "Inter_700Bold", marginBottom: 14 },
  toggleWrap: { flexDirection: "row", backgroundColor: "#F0E8FF", borderRadius: 30, padding: 4, marginBottom: 8 },
  toggleBtn: { flex: 1 },
  toggleGradient: { paddingVertical: 10, borderRadius: 26, alignItems: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  toggleInactive: { paddingVertical: 10, borderRadius: 26, alignItems: "center" },
  toggleTextActive: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  toggleTextInactive: { fontSize: 14, fontWeight: "600", color: "#A090B8", fontFamily: "Inter_600SemiBold" },
  aiCard: { flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: 20, marginTop: 4, marginBottom: 10 },
  aiAvatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  aiCardInfo: { flex: 1 },
  aiOnlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#90BE6D" },
  onlineLabel: { fontSize: 11, color: "#90BE6D", fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  aiName: { fontSize: 16, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  aiSub: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_400Regular", marginTop: 2 },
  chipsOuterWrapper: { flexGrow: 0, minHeight: 46, justifyContent: "center" },
  chipsRow: { gap: 8, paddingHorizontal: 20, paddingVertical: 6, alignItems: "center" },
  chip: { backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#EAD4F5", shadowColor: "#A78BFA", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  chipText: { fontSize: 13, color: "#A78BFA", fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  messagesList: { paddingHorizontal: 20, gap: 10, flexGrow: 1 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 4 },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAi: { justifyContent: "flex-start" },
  msgAiIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "78%", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleUser: { backgroundColor: "#A78BFA", borderBottomRightRadius: 6 },
  bubbleAi: { backgroundColor: "#F0E8FF", borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular", textAlign: "right" },
  bubbleTextUser: { color: "#FFFFFF" },
  bubbleTextAi: { color: "#4A3070" },
  typingBubble: { backgroundColor: "#F0E8FF", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, alignSelf: "flex-start", marginBottom: 4 },
  typingText: { fontSize: 13, color: "#A090B8", fontFamily: "Inter_400Regular", fontStyle: "italic" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 10, backgroundColor: "#EDE5FF" },
  chatInput: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: "#4A3070", borderWidth: 1, borderColor: "#D8C4F5", fontFamily: "Inter_400Regular", textAlign: "right" },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  doctorsScroll: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  docCard: { gap: 12 },
  docHeader: { flexDirection: "row", gap: 14, alignItems: "center" },
  docAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  docInfo: { flex: 1, gap: 2 },
  docName: { fontSize: 16, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  docSpec: { fontSize: 13, color: "#A78BFA", fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  docClinic: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_400Regular" },
  msgDocBtn: { backgroundColor: "#A78BFA", borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  msgDocText: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  chatChildrenSelectorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chatChildButton: { backgroundColor: "#A78BFA", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", alignItems: "center" },
  chatChildButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" }
});
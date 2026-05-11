import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES = [
  { id: "bug",        label: "Bug Report",   icon: "bug-outline",        color: "#FF6B6B" },
  { id: "suggestion", label: "Suggestion",   icon: "bulb-outline",       color: "#F8961E" },
  { id: "issue",      label: "Other Issue",  icon: "alert-circle-outline", color: "#9B7FFF" },
];

export default function SupportFeedbackScreen() {
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;
  const botPad  = Platform.OS === "web" ? 34 : insets.bottom;

  const [category,    setCategory]    = useState<string | null>(null);
  const [message,     setMessage]     = useState("");
  const [focused,     setFocused]     = useState(false);
  const [sending,     setSending]     = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    Alert.alert(
      "Message Sent",
      "Thank you for your feedback! We'll review it and get back to you soon.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }

  const canSend = message.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPad }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1A0F2E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Support & Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={["#48CAE4", "#0096B7"]} style={styles.heroIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Send us a message and we'll get back to you as soon as possible.</Text>
        </View>

        {/* Category */}
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.categoriesRow}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => { setCategory(cat.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.categoryBtn, active && { borderColor: cat.color, backgroundColor: cat.color + "14" }]}
                activeOpacity={0.8}
              >
                <Ionicons name={cat.icon as any} size={18} color={active ? cat.color : "#8B7BAB"} />
                <Text style={[styles.categoryLabel, active && { color: cat.color, fontFamily: "Inter_700Bold" }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Message */}
        <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Your Message</Text>
        <View style={[styles.messageBox, focused && styles.messageBoxFocused]}>
          <TextInput
            style={styles.messageInput}
            placeholder="Describe the issue, bug, or suggestion in detail…"
            placeholderTextColor="#C0B0D8"
            value={message}
            onChangeText={setMessage}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>{message.length}/1000</Text>
        </View>

        {/* Send */}
        <TouchableOpacity onPress={handleSend} disabled={!canSend} activeOpacity={0.88}>
          <LinearGradient
            colors={canSend ? ["#48CAE4", "#0096B7"] : ["#C0B0D8", "#D0C0E8"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.sendBtn}
          >
            {sending ? (
              <Text style={styles.sendBtnText}>Sending…</Text>
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.sendBtnText}>Send Message</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          We typically respond within 24–48 hours. Your feedback helps us improve Draw Mind AI for every family.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F1FF" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#1A0F2E", fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  hero: { alignItems: "center", gap: 10, marginBottom: 28 },
  heroIcon: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#48CAE4", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#1A0F2E", fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: "#8B7BAB", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 280 },

  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#4A3880", fontFamily: "Inter_700Bold", marginBottom: 10, letterSpacing: 0.3, textTransform: "uppercase" },

  categoriesRow: { flexDirection: "row", gap: 10, marginBottom: 22, flexWrap: "wrap" },
  categoryBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: "#DDD6FF", backgroundColor: "#fff" },
  categoryLabel: { fontSize: 13, color: "#8B7BAB", fontFamily: "Inter_500Medium", fontWeight: "500" },

  messageBox: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: "#DDD6FF", minHeight: 140 },
  messageBoxFocused: { borderColor: "#6C4DFF" },
  messageInput: { fontSize: 14, color: "#1A0F2E", fontFamily: "Inter_400Regular", lineHeight: 22, minHeight: 100 },
  charCount: { fontSize: 10, color: "#C0B0D8", fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 6 },

  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17, borderRadius: 28, marginBottom: 16, shadowColor: "#48CAE4", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18, elevation: 10 },
  sendBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },

  footerNote: { fontSize: 12, color: "#B0A0CC", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
});

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FEATURES = [
  { icon: "brush-outline",      color: "#A78BFA", title: "Drawing Analysis",    desc: "AI-powered emotional pattern recognition from children's drawings." },
  { icon: "heart-outline",      color: "#FF6B9D", title: "Emotional Wellness",  desc: "Track and understand your child's emotional development over time." },
  { icon: "people-outline",     color: "#48CAE4", title: "Multi-Child Support", desc: "Manage profiles for all your children in one place." },
  { icon: "chatbubble-outline", color: "#90BE6D", title: "AI Assistant",        desc: "Chat with our AI psychology assistant for insights and guidance." },
];

export default function AboutAppScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#4A3070" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>About App</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero gradient card */}
        <LinearGradient
          colors={["#C4A8F5", "#D4B0F0", "#F0A8C8"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.mascotCircle}>
            <Image
              source={require("@/assets/images/mascot.png")}
              style={styles.mascot}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Draw Mind AI</Text>
          <Text style={styles.tagline}>Understanding children through the art they create</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </LinearGradient>

        {/* Purpose */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.missionCard}>
            <Text style={styles.missionText}>
              Draw Mind AI helps parents and caregivers gain deeper insight into their children's emotional world — through the universal language of drawing.
            </Text>
            <Text style={styles.missionText}>
              Children express what words can't always capture. Our AI reads the colors, shapes, and patterns in their artwork to provide meaningful emotional analysis and guidance for parents.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresList}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: f.color + "18" }]}>
                  <Ionicons name={f.icon as any} size={20} color={f.color} />
                </View>
                <View style={styles.featureTexts}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoCard}>
            {[
              ["Version",     "1.0.0"],
              ["Platform",    Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "Web"],
              ["Developer",   "Draw Mind AI Team"],
              ["Category",    "Health & Wellness"],
              ["Language",    "English, Arabic"],
            ].map(([label, value]) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color="#C4B0FF" />
          <Text style={styles.disclaimerText}>
            Draw Mind AI is designed as a supplementary wellness tool and does not replace professional psychological or medical advice. Always consult a qualified professional for clinical concerns.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  heroCard: { borderRadius: 28, padding: 28, alignItems: "center", gap: 10, marginBottom: 24, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 12 },
  mascotCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  mascot: { width: 60, height: 60 },
  appName: { fontSize: 26, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 240 },
  versionBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  versionText: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold", fontWeight: "600" },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#4A3070", fontFamily: "Inter_700Bold", marginBottom: 12, letterSpacing: -0.2 },

  missionCard: { backgroundColor: "#fff", borderRadius: 20, padding: 18, gap: 12, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  missionText: { fontSize: 14, color: "#4A3880", fontFamily: "Inter_400Regular", lineHeight: 22 },

  featuresList: { gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, backgroundColor: "#fff", borderRadius: 18, padding: 14, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  featureIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  featureTexts: { flex: 1, gap: 3 },
  featureTitle: { fontSize: 14, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  featureDesc: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_400Regular", lineHeight: 18 },

  infoCard: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#F0EEFF" },
  infoLabel: { fontSize: 13, color: "#A090B8", fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#4A3070", fontFamily: "Inter_600SemiBold" },

  disclaimer: { flexDirection: "row", gap: 10, backgroundColor: "#F0E8FF", borderRadius: 16, padding: 14, alignItems: "flex-start" },
  disclaimerText: { flex: 1, fontSize: 12, color: "#7A6A9A", fontFamily: "Inter_400Regular", lineHeight: 18 },
});

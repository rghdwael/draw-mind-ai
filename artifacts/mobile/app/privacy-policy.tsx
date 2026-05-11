import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `Draw Mind AI collects information you provide directly when creating an account, including your name, email address, and details about the children you add to the app (name, age, and gender).\n\nWe also collect drawings and images you upload or create within the app, along with parent notes you add. This data is stored locally on your device using secure storage and is used solely to provide the app's features.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use the information collected to:\n\n• Provide and improve the emotional analysis features of the app.\n• Generate insights and recommendations based on drawings.\n• Allow you to track your child's emotional development over time.\n• Send support responses when you contact us.\n\nWe do not sell, rent, or share your personal information with third parties for marketing purposes.`,
  },
  {
    title: "3. Children's Privacy",
    body: `Draw Mind AI is designed for use by parents and caregivers. We are committed to protecting the privacy of children. We do not knowingly collect personal information directly from children under the age of 13.\n\nAll data entered about children is provided by the parent or guardian and is stored securely on the user's device.`,
  },
  {
    title: "4. Data Storage & Security",
    body: `Your data is stored locally on your device using encrypted AsyncStorage. We employ industry-standard security measures to protect your information from unauthorized access, disclosure, or destruction.\n\nWe recommend keeping your device secured with a passcode or biometric authentication to further protect your data.`,
  },
  {
    title: "5. Image & Drawing Data",
    body: `Drawings and images you create or upload are stored locally on your device. Any AI analysis is performed using anonymized data. We do not store your images on our servers without your explicit consent.\n\nYou may delete drawings and child profiles at any time from within the app.`,
  },
  {
    title: "6. Your Rights",
    body: `You have the right to:\n\n• Access the personal data we hold about you.\n• Correct any inaccurate information.\n• Request deletion of your data.\n• Withdraw consent for data processing at any time.\n\nTo exercise any of these rights, please contact us through the Support & Feedback section.`,
  },
  {
    title: "7. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this document and, where appropriate, notifying you within the app.\n\nYour continued use of Draw Mind AI after changes are made constitutes your acceptance of the updated policy.`,
  },
  {
    title: "8. Contact Us",
    body: `If you have any questions or concerns about this Privacy Policy or our data practices, please contact us through the Support & Feedback section in the app.\n\nWe are committed to resolving any concerns about your privacy.`,
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1A0F2E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={["#577590", "#3D5A73"]} style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerDate}>Last updated: May 2026</Text>
        </LinearGradient>

        <Text style={styles.intro}>
          At Draw Mind AI, we take your privacy seriously. This policy explains what information we collect, how we use it, and the choices you have.
        </Text>

        {/* Sections */}
        {SECTIONS.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F1FF" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#1A0F2E", fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  header: { borderRadius: 24, padding: 24, alignItems: "center", gap: 8, marginBottom: 20 },
  headerIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  headerDate: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },

  intro: { fontSize: 14, color: "#4A3880", fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 20, backgroundColor: "#fff", borderRadius: 18, padding: 16 },

  section: { marginBottom: 16, backgroundColor: "#fff", borderRadius: 18, padding: 18 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A0F2E", fontFamily: "Inter_700Bold", marginBottom: 10 },
  sectionBody: { fontSize: 13, color: "#5A4A7A", fontFamily: "Inter_400Regular", lineHeight: 22 },
});

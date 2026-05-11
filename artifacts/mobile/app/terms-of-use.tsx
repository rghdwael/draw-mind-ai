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
    title: "1. Acceptance of Terms",
    body: `By downloading, installing, or using Draw Mind AI ("the App"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the App.\n\nThese Terms apply to all users of the App, including parents, guardians, and caregivers.`,
  },
  {
    title: "2. Description of Service",
    body: `Draw Mind AI is a wellness application designed to help parents and caregivers understand children's emotional states through AI analysis of drawings. The App provides:\n\n• AI-powered emotional analysis of children's artwork.\n• Child profile management and tracking.\n• Parent notes and observations storage.\n• Access to an AI wellness assistant.`,
  },
  {
    title: "3. Not a Medical or Clinical Tool",
    body: `Draw Mind AI is a supplementary wellness and insight tool only. It is NOT a substitute for professional psychological, psychiatric, or medical advice, diagnosis, or treatment.\n\nAlways seek the advice of a qualified mental health professional for any concerns about your child's emotional or psychological wellbeing. Never disregard professional advice based on information provided by this App.`,
  },
  {
    title: "4. User Responsibilities",
    body: `As a user, you agree to:\n\n• Use the App only for lawful purposes.\n• Provide accurate information when creating profiles.\n• Take sole responsibility for how you use the AI analysis and insights.\n• Not use the App to harm, exploit, or abuse children.\n• Keep your login credentials secure and confidential.`,
  },
  {
    title: "5. Intellectual Property",
    body: `All content within Draw Mind AI — including but not limited to software, design, graphics, text, and logos — is owned by Draw Mind AI and protected by applicable intellectual property laws.\n\nYou may not copy, modify, distribute, sell, or lease any part of the App without our express written permission.`,
  },
  {
    title: "6. User-Generated Content",
    body: `Drawings, images, and notes you create or upload within the App remain your property. By using the App, you grant Draw Mind AI a limited license to process this content solely for the purpose of providing the AI analysis features.\n\nWe will not use your content for advertising or share it with third parties without your consent.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `To the fullest extent permitted by law, Draw Mind AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.\n\nThe App is provided "as is" without warranties of any kind, express or implied.`,
  },
  {
    title: "8. Modifications to Terms",
    body: `We reserve the right to modify these Terms of Use at any time. Changes will be effective immediately upon posting within the App. Your continued use of the App after changes are posted constitutes your acceptance of the revised terms.`,
  },
  {
    title: "9. Governing Law",
    body: `These Terms of Use shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the App shall be resolved through good-faith negotiation first, and where necessary, through appropriate legal channels.`,
  },
  {
    title: "10. Contact",
    body: `If you have any questions about these Terms of Use, please contact us through the Support & Feedback section within the App. We are committed to addressing your concerns promptly and fairly.`,
  },
];

export default function TermsOfUseScreen() {
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
        <Text style={styles.navTitle}>Terms of Use</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={["#4A3880", "#8B7BAB"]} style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="document-text" size={28} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Terms of Use</Text>
          <Text style={styles.headerDate}>Last updated: May 2026</Text>
        </LinearGradient>

        <Text style={styles.intro}>
          Please read these Terms of Use carefully before using Draw Mind AI. By using the App you agree to these terms.
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

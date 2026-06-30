import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";

const SETTINGS = [
  { icon: "person-outline",             label: "Edit Profile",      color: "#A78BFA", route: "/edit-profile" },
  { icon: "people-outline",             label: "Update Child Info",  color: "#B89CFF", route: "/choose-child?mode=edit" },
  { icon: "chatbubble-outline",         label: "Support & Feedback", color: "#48CAE4", route: "/support-feedback" },
  { icon: "language-outline",           label: "Language",           color: "#90BE6D", route: "/language" },
  { icon: "lock-closed-outline",        label: "Change Password",    color: "#F8961E", route: "/change-password" },
  { icon: "information-circle-outline", label: "About App",          color: "#C4B0FF", route: "/about-app" },
  { icon: "shield-outline",             label: "Privacy Policy",     color: "#577590", route: "/privacy-policy" },
  { icon: "document-text-outline",      label: "Terms of Use",       color: "#A090B8", route: "/terms-of-use" },
] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  
  const { userName, userEmail, children, drawings, userRelationship, logout } = useApp() || { 
    userName: "Parent", 
    userEmail: "", 
    children: [], 
    drawings: [], 
    userRelationship: "Parent",
    logout: async () => {} 
  };
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const safeDrawings = drawings || [];

  function handleSettingPress(route: string) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push(route as any);
  }

  function handleLogoutPress() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setShowSignOutModal(true);
  }

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      if (logout) {
        await logout();
      }
      setShowSignOutModal(false);
      router.replace("/welcome");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gradient Header ── */}
        <LinearGradient
          colors={["#C4A8F5", "#D4B0F0", "#F0B8D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerBg, { paddingTop: topPad + 20 }]}
        >
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{userName ? userName.slice(0, 1).toUpperCase() : "P"}</Text>
          </View>
          <Text style={styles.profileName}>{userName || "Parent"}</Text>
          <Text style={styles.profileEmail}>{userEmail || "parent@example.com"}</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── Stats Row (Cleaned & Fixed Section) ── */}
          <View style={styles.statsRow}>
            {/* كرت الأطفال */}
            <GlassCard style={styles.statCard} padding={16}>
              <Text style={styles.statNum}>{children ? children.length : 0}</Text>
              <Text style={styles.statLabel}>Children</Text>
            </GlassCard>

            {/* كرت الرسومات المباشر من مصفوفة الحفظ الفعلي */}
            <GlassCard style={styles.statCard} padding={16}>
              <Text style={styles.statNum}>{safeDrawings.length}</Text>
              <Text style={styles.statLabel}>Drawings</Text>
            </GlassCard>

            {/* كرت الدور المخصص المستقر */}
            <GlassCard style={styles.statCard} padding={16}>
              <Text style={[styles.statNum, { fontSize: 16, marginTop: 4, marginBottom: 2 }]} numberOfLines={1}>
                {userRelationship || "Parent"}
              </Text>
              <Text style={styles.statLabel}>Role</Text>
            </GlassCard>
          </View>

          {/* Premium Banner */}
          <LinearGradient
            colors={["#C4A8F5", "#F0A8C8"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.premiumBanner}
          >
            <View style={styles.premiumLeft}>
              <Ionicons name="diamond" size={22} color="#FFD700" />
              <View>
                <Text style={styles.premiumTitle}>Go Premium</Text>
                <Text style={styles.premiumSub}>Unlimited AI analysis & insights</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.premiumBtn} activeOpacity={0.85}>
              <Text style={styles.premiumBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Settings List */}
          <GlassCard style={styles.settingsList} padding={0}>
            {SETTINGS.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => handleSettingPress(item.route)}
                style={[styles.settingItem, idx < SETTINGS.length - 1 && styles.settingItemBorder]}
                activeOpacity={0.75}
              >
                <View style={[styles.settingIcon, { backgroundColor: item.color + "18" }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C0B0D8" />
              </TouchableOpacity>
            ))}
          </GlassCard>

          {/* Sign Out button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogoutPress}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Sign-out confirmation modal ── */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={30} color="#FF6B6B" />
            </View>

            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to sign out of Draw Mind AI?
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowSignOutModal(false)}
                activeOpacity={0.8}
                disabled={signingOut}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, signingOut && { opacity: 0.6 }]}
                onPress={confirmSignOut}
                activeOpacity={0.85}
                disabled={signingOut}
              >
                <Text style={styles.confirmBtnText}>
                  {signingOut ? "Signing out…" : "Sign Out"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  headerBg: { paddingHorizontal: 20, paddingBottom: 60, alignItems: "center" },
  avatarLarge: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.5)", marginBottom: 12 },
  avatarLargeText: { fontSize: 36, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 22, fontWeight: "800", color: "#4A3070", fontFamily: "Inter_700Bold", marginBottom: 4 },
  profileEmail: { fontSize: 14, color: "rgba(74,48,112,0.75)", fontFamily: "Inter_400Regular" },
  body: { marginTop: -36, paddingHorizontal: 20, gap: 16 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", color: "#A78BFA", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, color: "#A090B8", fontFamily: "Inter_500Medium", marginTop: 2 },
  premiumBanner: { borderRadius: 22, paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  premiumLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  premiumTitle: { fontSize: 15, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  premiumSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  premiumBtn: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  premiumBtnText: { fontSize: 13, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  settingsList: { borderRadius: 24, overflow: "hidden" },
  settingItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 15, gap: 14 },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: "#F0E8FF" },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingLabel: { flex: 1, fontSize: 15, color: "#4A3070", fontFamily: "Inter_500Medium", fontWeight: "500" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 16, shadowColor: "#FF6B6B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3, marginBottom: 8 },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#FF6B6B", fontFamily: "Inter_700Bold" },
  overlay: { flex: 1, backgroundColor: "rgba(50,30,100,0.4)", justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  modalCard: { width: "100%", backgroundColor: "#FDFAFF", borderRadius: 28, padding: 28, alignItems: "center", shadowColor: "#7B5CE5", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 20 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 22, backgroundColor: "#FFF0F0", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#3D2B6E", fontFamily: "Inter_700Bold", marginBottom: 8 },
  modalBody: { fontSize: 14, color: "#8070A0", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 28 },
  modalBtns: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 18, backgroundColor: "#F0E8FF", alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#7B5CE5", fontFamily: "Inter_600SemiBold" },
  confirmBtn: { flex: 1, paddingVertical: 15, borderRadius: 18, backgroundColor: "#FF6B6B", alignItems: "center" },
  confirmBtnText: { fontSize: 15, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
});
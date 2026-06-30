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
import { useApp } from "@/context/AppContext";

// ── Relationship options ───────────────────────────────────────────────────────
const RELATIONSHIPS = [
  { id: "father",    label: "Father",    icon: "person-outline" },
  { id: "mother",    label: "Mother",    icon: "person-outline" },
  { id: "guardian",  label: "Guardian",  icon: "shield-outline" },
  { id: "teacher",   label: "Teacher",   icon: "school-outline" },
  { id: "caregiver", label: "Caregiver", icon: "heart-outline"  },
  { id: "other",     label: "Other",     icon: "ellipsis-horizontal-outline" },
] as const;

type RelId = (typeof RELATIONSHIPS)[number]["id"];

// ── Reusable text field ───────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, keyboardType, optional, secure,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; keyboardType?: any; optional?: boolean; secure?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [show,    setShow]    = useState(false);
  return (
    <View style={f.wrap}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
        {optional && <Text style={f.optional}>optional</Text>}
      </View>
      <View style={[f.inputRow, focused && f.inputRowFocused]}>
        <TextInput
          style={f.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#C0B0D8"
          keyboardType={keyboardType ?? "default"}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          secureTextEntry={secure && !show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShow((s) => !s)} style={f.eyeBtn}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={17} color="#A090B8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
const f = StyleSheet.create({
  wrap:           { gap: 7 },
  labelRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
  label:          { fontSize: 13, fontWeight: "600", color: "#4A3880", fontFamily: "Inter_600SemiBold" },
  optional:       { fontSize: 11, color: "#B0A0CC", fontFamily: "Inter_400Regular", backgroundColor: "#F0E8FF", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  inputRow:       { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: "#EAD4F5", height: 52 },
  inputRowFocused:{ borderColor: "#A78BFA" },
  input:          { flex: 1, fontSize: 15, color: "#4A3070", fontFamily: "Inter_400Regular" },
  eyeBtn:         { padding: 4 },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { userName, userEmail, userPhone, userRelationship, updateUserProfile } = useApp();

  const [name,         setName]         = useState(userName);
  const [email,        setEmail]        = useState(userEmail);
  const [phone,        setPhone]        = useState(userPhone);
  const [relationship, setRelationship] = useState<RelId | "">(
    (RELATIONSHIPS.find((r) => r.id === userRelationship)?.id ?? "") as RelId | ""
  );
  const [customRole,   setCustomRole]   = useState(
    userRelationship && !RELATIONSHIPS.find((r) => r.id === userRelationship)
      ? userRelationship : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert("Name required", "Please enter your full name."); return; }
    if (!email.trim()) { Alert.alert("Email required", "Please enter your email address."); return; }
    if (relationship === "other" && !customRole.trim()) {
      Alert.alert("Role required", "Please describe your relationship to the child."); return;
    }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const finalRelationship = relationship === "other" ? customRole.trim() : relationship;
    await updateUserProfile(name.trim(), email.trim(), phone.trim(), finalRelationship);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Profile Updated", "Your profile has been saved successfully.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  const initials = name.slice(0, 2).toUpperCase() || "ME";

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPad }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#4A3070" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar hero */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={["#C4A8F5", "#D4B0F0", "#F0A8C8"]} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.avatarName}>{name || "Your Name"}</Text>
          <Text style={styles.avatarSub}>Account owner</Text>
        </View>

        {/* ── Basic Info ── */}
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.fieldsCard}>
          <Field label="Full Name"        value={name}  onChange={setName}  placeholder="Enter your full name" />
          <View style={styles.divider} />
          <Field label="Email Address"    value={email} onChange={setEmail} placeholder="your@email.com" keyboardType="email-address" />
          <View style={styles.divider} />
          <Field label="Phone Number"     value={phone} onChange={setPhone} placeholder="+1 234 567 8900" keyboardType="phone-pad" optional />
        </View>

        {/* ── Relationship ── */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Your Role</Text>
        <Text style={styles.sectionSub}>
          Let us know your relationship to the child. This helps personalise the analysis and reports.
        </Text>

        <View style={styles.rolesGrid}>
          {RELATIONSHIPS.map((rel) => {
            const active = relationship === rel.id;
            return (
              <TouchableOpacity
                key={rel.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRelationship(rel.id);
                }}
                activeOpacity={0.8}
                style={[styles.roleCard, active && styles.roleCardActive]}
              >
                <View style={[styles.roleIconWrap, active && styles.roleIconWrapActive]}>
                  <Ionicons name={rel.icon as any} size={18} color={active ? "#fff" : "#A78BFA"} />
                </View>
                <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>{rel.label}</Text>
                {active && (
                  <View style={styles.roleCheck}>
                    <Ionicons name="checkmark-circle" size={14} color="#A78BFA" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom role input for "Other" */}
        {relationship === "other" && (
          <View style={styles.customRoleWrap}>
            <Field
              label="Describe your role"
              value={customRole}
              onChange={setCustomRole}
              placeholder="e.g. Grandparent, Therapist, Nanny…"
            />
          </View>
        )}

        {/* ── Save button ── */}
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.88}>
          <LinearGradient
            colors={["#C4A8F5", "#D4B0F0", "#F0A8C8"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Changes"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  navBar:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  navTitle:  { fontSize: 18, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  scroll:    { paddingHorizontal: 20, paddingTop: 4 },

  /* Avatar */
  avatarSection: { alignItems: "center", gap: 8, marginBottom: 28 },
  avatar:        { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 },
  avatarText:    { fontSize: 30, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  avatarName:    { fontSize: 20, fontWeight: "800", color: "#4A3070", fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  avatarSub:     { fontSize: 12, color: "#B0A0CC", fontFamily: "Inter_400Regular" },

  /* Section */
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold", marginBottom: 12, letterSpacing: -0.1 },
  sectionSub:   { fontSize: 12, color: "#A090B8", fontFamily: "Inter_400Regular", marginBottom: 14, marginTop: -8, lineHeight: 18 },

  /* Fields card */
  fieldsCard: { backgroundColor: "#fff", borderRadius: 22, padding: 18, gap: 16, marginBottom: 20, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  divider:    { height: 1, backgroundColor: "#F0EEFF" },

  /* Role grid */
  rolesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  roleCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    gap: 7,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: "#EAD4F5",
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  roleCardActive:    { borderColor: "#A78BFA", backgroundColor: "#FDF8F5" },
  roleIconWrap:      { width: 40, height: 40, borderRadius: 14, backgroundColor: "#F0E8FF", alignItems: "center", justifyContent: "center" },
  roleIconWrapActive:{ backgroundColor: "#A78BFA" },
  roleLabel:         { fontSize: 12, fontWeight: "600", color: "#4A3880", fontFamily: "Inter_600SemiBold", textAlign: "center" },
  roleLabelActive:   { color: "#A78BFA", fontFamily: "Inter_700Bold" },
  roleCheck:         { position: "absolute", top: 8, right: 8 },

  customRoleWrap: { marginBottom: 16 },

  /* Save */
  saveBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17, borderRadius: 28, marginTop: 4, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 10 },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
});

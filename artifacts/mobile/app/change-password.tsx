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

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={pf.wrap}>
      <Text style={pf.label}>{label}</Text>
      <View style={[pf.inputRow, focused && pf.inputRowFocused]}>
        <TextInput
          style={pf.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#C0B0D8"
          secureTextEntry={!show}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShow((s) => !s)} style={pf.eyeBtn}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color="#8B7BAB" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pf = StyleSheet.create({
  wrap: { gap: 7 },
  label: { fontSize: 13, fontWeight: "600", color: "#4A3880", fontFamily: "Inter_600SemiBold" },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: "#DDD6FF", height: 52 },
  inputRowFocused: { borderColor: "#6C4DFF" },
  input: { flex: 1, fontSize: 15, color: "#1A0F2E", fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 4 },
});

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleUpdate() {
    if (!current || !next || !confirm) {
      Alert.alert("Missing fields", "Please fill in all fields."); return;
    }
    if (next.length < 6) {
      Alert.alert("Too short", "New password must be at least 6 characters."); return;
    }
    if (next !== confirm) {
      Alert.alert("Mismatch", "New password and confirmation do not match."); return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    Alert.alert("Password Updated", "Your password has been changed successfully.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  const canSubmit = current.length > 0 && next.length >= 6 && confirm.length > 0 && !loading;

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
        <Text style={styles.navTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={["#F8961E", "#E07010"]} style={styles.heroIcon}>
            <Ionicons name="lock-closed-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.heroTitle}>Update Password</Text>
          <Text style={styles.heroSub}>Choose a strong password to keep your account safe.</Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <PasswordField label="Current Password"      value={current}  onChange={setCurrent}  placeholder="Enter current password" />
          <PasswordField label="New Password"          value={next}     onChange={setNext}     placeholder="At least 6 characters" />
          <PasswordField label="Confirm New Password"  value={confirm}  onChange={setConfirm}  placeholder="Repeat new password" />
        </View>

        {/* Password strength hint */}
        {next.length > 0 && (
          <View style={styles.strengthRow}>
            {[1,2,3,4].map((i) => (
              <View
                key={i}
                style={[
                  styles.strengthBar,
                  {
                    backgroundColor:
                      next.length >= i * 3
                        ? next.length >= 10 ? "#90BE6D"
                          : next.length >= 6 ? "#F8961E" : "#FF6B6B"
                        : "#EDE9FF",
                  },
                ]}
              />
            ))}
            <Text style={styles.strengthLabel}>
              {next.length < 6 ? "Too short" : next.length < 10 ? "Fair" : "Strong"}
            </Text>
          </View>
        )}

        {/* Button */}
        <TouchableOpacity onPress={handleUpdate} disabled={!canSubmit} activeOpacity={0.88}>
          <LinearGradient
            colors={canSubmit ? ["#F8961E", "#E07010"] : ["#C0B0D8", "#D0C0E8"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.updateBtn}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
            <Text style={styles.updateBtnText}>{loading ? "Updating…" : "Update Password"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          For security, you'll remain signed in after changing your password.
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
  heroIcon: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#F8961E", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#1A0F2E", fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: "#8B7BAB", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 280 },

  fields: { gap: 16, marginBottom: 20 },

  strengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  strengthBar: { flex: 1, height: 5, borderRadius: 3 },
  strengthLabel: { fontSize: 11, color: "#8B7BAB", fontFamily: "Inter_500Medium", width: 56, textAlign: "right" },

  updateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17, borderRadius: 28, marginBottom: 16, shadowColor: "#F8961E", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18, elevation: 10 },
  updateBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },

  footerNote: { fontSize: 12, color: "#B0A0CC", fontFamily: "Inter_400Regular", textAlign: "center" },
});

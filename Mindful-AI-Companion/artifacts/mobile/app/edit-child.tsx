import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";

const AVATAR_COLORS = [
  { color: "#A78BFA", label: "Purple" },
  { color: "#FF6B9D", label: "Pink" },
  { color: "#48CAE4", label: "Blue" },
  { color: "#F8961E", label: "Orange" },
  { color: "#90BE6D", label: "Green" },
  { color: "#F3722C", label: "Coral" },
];

const GENDERS = ["Male", "Female"];

export default function EditChildScreen() {
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  
  const appContext = useApp();
  const children = appContext?.children || [];
  const child = children.find((c: any) => String(c.id) === String(childId));

  const [name, setName] = useState(child?.name ?? "");
  const [age, setAge] = useState(child ? String(child.age) : "");
  const [gender, setGender] = useState(child?.gender ?? "Male");
  const [activities, setActivities] = useState(child?.favoriteActivities ?? "");
  const [emotionalNotes, setEmotionalNotes] = useState(child?.emotionalNotes ?? "");
  const [parentNotes, setParentNotes] = useState(child?.parentNotes ?? "");
  const [selectedColor, setSelectedColor] = useState(child?.avatarColor ?? AVATAR_COLORS[0].color);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleSave() {
    if (!name.trim() || !age.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/children/${childId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_name: name.trim(), age: parseInt(age, 10) || 0, gender }),
      });
      if (response.ok) {
        if (appContext && 'fetchChildren' in appContext) await (appContext as any).fetchChildren();
        router.replace("/profile");
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  // 🔴 دالة الحذف النهائية
  async function handleDeleteChild() {
  console.log("الزر يعمل! سنحاول الآن الاتصال بـ:", `http://localhost:5000/children/${childId}`);
  
  Alert.alert("Delete", "Are you sure?", [
    { text: "Cancel", style: "cancel" },
    { 
      text: "Delete", 
      style: "destructive",
      onPress: async () => {
        setLoading(true);
        try {
          const response = await fetch(`http://localhost:5000/children/${childId}`, { 
            method: 'POST',
            headers: { "Accept": "application/json", "Content-Type": "application/json" }
          });
          
          console.log("استجابة السيرفر:", response.status); 
          
          if (response.ok) {
            router.replace("/");
          } else {
            const err = await response.text();
            console.log("خطأ من السيرفر:", err);
            Alert.alert("Error", "Server responded with: " + response.status);
          }
        } catch (e) { 
          console.log("خطأ في الاتصال بالشبكة:", e);
          Alert.alert("Error", "Could not connect to server");
        } finally { setLoading(false); }
      }
    }
  ]);
}
  if (!child) return <View style={styles.container}><Text style={styles.notFound}>Child not found</Text></View>;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#4A3070" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarCircle, { backgroundColor: selectedColor }]}>
            <Text style={styles.avatarInitials}>{name.slice(0, 2).toUpperCase() || "CH"}</Text>
          </View>
          <Text style={styles.avatarLabel}>Choose Color</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((ac) => (
              <TouchableOpacity key={ac.color} onPress={() => setSelectedColor(ac.color)} 
                style={[styles.colorDot, { backgroundColor: ac.color }, selectedColor === ac.color && styles.colorDotSelected]} />
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <Field label="Child Name *" icon="person-outline"><TextInput style={styles.input} value={name} onChangeText={setName} /></Field>
          <Field label="Age *" icon="calendar-outline"><TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="number-pad" /></Field>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.genderBtn, gender === g && styles.genderBtnActive]}>
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <Field label="Favorite Activities" icon="star-outline"><TextInput style={styles.input} value={activities} onChangeText={setActivities} /></Field>
          
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={loading} style={{ flex: 0.6 }}>
              <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} style={styles.saveBtn}><Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save Changes"}</Text></LinearGradient>
            </TouchableOpacity>
          </View>

          {/* 🔴 زر حذف الطفل الجديد */}
          <TouchableOpacity onPress={handleDeleteChild} style={styles.deleteProfileBtn}>
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={styles.deleteProfileText}>Delete Child Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, icon, children }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color="#A090B8" style={{ marginRight: 10 }} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#4A3070" },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  avatarWrap: { alignItems: "center", paddingVertical: 20 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarInitials: { fontSize: 32, fontWeight: "700", color: "#fff" },
  avatarLabel: { fontSize: 13, color: "#A090B8", marginBottom: 12 },
  colorRow: { flexDirection: "row", gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: "#4A3070" },
  form: { gap: 4 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#4A3B7A", marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 16, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: "#EAD4F5" },
  input: { flex: 1, fontSize: 15, color: "#4A3070" },
  genderRow: { flexDirection: "row", gap: 10 },
  genderBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: "#F0E8FF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#EAD4F5" },
  genderBtnActive: { backgroundColor: "#A78BFA" },
  genderText: { fontSize: 14, color: "#A090B8", fontWeight: "600" },
  genderTextActive: { color: "#FFF" },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 0.4, height: 54, borderRadius: 27, backgroundColor: "#F0E8FF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#EAD4F5" },
  cancelText: { fontSize: 15, color: "#A78BFA", fontWeight: "600" },
  saveBtn: { height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  // في ملف edit-child.tsx
deleteProfileBtn: {
  marginTop: 32,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 16,
  backgroundColor: "#FEE2E2",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#FECACA",
  gap: 8,
  zIndex: 999, // 💡 هذا السطر يضمن أن الزر "فوق" أي شيء آخر
  elevation: 5, // للأندرويد
},
  deleteProfileText: { color: "#DC2626", fontSize: 15, fontWeight: "600" },
  notFound: { fontSize: 16, color: "#A090B8", textAlign: "center" }
});
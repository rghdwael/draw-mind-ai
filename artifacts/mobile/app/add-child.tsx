import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";

const AVATAR_COLORS = [
  { color: "#A78BFA", label: "Purple" },
  { color: "#FF6B9D", label: "Pink" },
  { color: "#48CAE4", label: "Blue" },
  { color: "#F8961E", label: "Orange" },
  { color: "#90BE6D", label: "Green" },
  { color: "#F3722C", label: "Coral" },
];

const GENDERS = ["Male", "Female"];

export default function AddChildScreen() {
  const insets = useSafeAreaInsets();
  const { addChild } = useApp();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [activities, setActivities] = useState("");
  const [emotionalNotes, setEmotionalNotes] = useState("");
  const [parentNotes, setParentNotes] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].color);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = async () => {
    if (!name.trim() || !age.trim()) return;
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addChild({
      name: name.trim(),
      age: parseInt(age, 10) || 0,
      gender,
      favoriteActivities: activities,
      emotionalNotes,
      parentNotes,
      avatarColor: selectedColor,
      initials: name.trim().slice(0, 2).toUpperCase(),
    });
    setLoading(false);
    router.back();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad, paddingBottom: botPad },
      ]}
    >
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#4A3070" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add Child</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarPreviewWrap}>
          <View
            style={[
              styles.avatarPreview,
              { backgroundColor: selectedColor },
            ]}
          >
            <Text style={styles.avatarInitials}>
              {name ? name.slice(0, 2).toUpperCase() : "??"}
            </Text>
          </View>
          <Text style={styles.avatarLabel}>Choose Color</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((ac) => (
              <TouchableOpacity
                key={ac.color}
                onPress={() => setSelectedColor(ac.color)}
                style={[
                  styles.colorDot,
                  { backgroundColor: ac.color },
                  selectedColor === ac.color && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Child Name *</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#A090B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter child's name"
                placeholderTextColor="#A090B8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Age *</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#A090B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Age in years"
                placeholderTextColor="#A090B8"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  style={[
                    styles.genderBtn,
                    gender === g && styles.genderBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === g && styles.genderTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Favorite Activities</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="star-outline"
                size={18}
                color="#A090B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Drawing, Dancing, Reading"
                placeholderTextColor="#A090B8"
                value={activities}
                onChangeText={setActivities}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Emotional Notes</Text>
            <View style={[styles.inputWrap, styles.textareaWrap]}>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Any emotional observations..."
                placeholderTextColor="#A090B8"
                value={emotionalNotes}
                onChangeText={setEmotionalNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Parent Notes</Text>
            <View style={[styles.inputWrap, styles.textareaWrap]}>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Your personal notes about your child..."
                placeholderTextColor="#A090B8"
                value={parentNotes}
                onChangeText={setParentNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <GradientButton
              label="Save Child"
              onPress={handleSave}
              loading={loading}
              disabled={!name.trim() || !age.trim()}
              style={styles.saveBtn}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F5",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4A3070",
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarPreviewWrap: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  avatarLabel: {
    fontSize: 14,
    color: "#A090B8",
    marginBottom: 12,
    fontFamily: "Inter_500Medium",
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: "#4A3070",
  },
  form: {
    gap: 4,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A3B7A",
    marginBottom: 8,
    fontFamily: "Inter_600SemiBold",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: "#EAD4F5",
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#4A3070",
    fontFamily: "Inter_400Regular",
  },
  textareaWrap: {
    height: "auto",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  textarea: {
    minHeight: 72,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0E8FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EAD4F5",
  },
  genderBtnActive: {
    backgroundColor: "#A78BFA",
    borderColor: "#A78BFA",
  },
  genderText: {
    fontSize: 14,
    color: "#A090B8",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  genderTextActive: {
    color: "#FFFFFF",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 0.4,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F0E8FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EAD4F5",
  },
  cancelText: {
    fontSize: 15,
    color: "#A78BFA",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  saveBtn: {
    flex: 0.6,
  },
});

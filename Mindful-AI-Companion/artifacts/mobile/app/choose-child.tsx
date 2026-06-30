import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { Child } from "@/context/AppContext";

// ── Child selectable card ─────────────────────────────────────────────────────
function ChildCard({
  child,
  onPress,
}: {
  child: Child;
  onPress: (id: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 2 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40, bounciness: 6 }),
    ]).start(() => {
      // Trigger navigation instantly after the animation starts
      onPress(String(child.id));
    });
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View style={styles.childCard}>
          {/* Avatar */}
          <LinearGradient
            colors={[(child.avatarColor || "#6C4DFF") + "DD", (child.avatarColor || "#6C4DFF")]}
            style={styles.childAvatar}
          >
            <View style={styles.avatarShine} />
            {/* 🚨 Looks for an icon first, falls back to initials if missing */}
            {(child as any).icon ? (
               <Ionicons name={(child as any).icon} size={28} color="#fff" />
            ) : (
               <Text style={styles.avatarInitials}>{child.name.slice(0, 2).toUpperCase()}</Text>
            )}
          </LinearGradient>

          {/* Info */}
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childMeta}>Age {child.age} · {child.gender}</Text>
          </View>

          {/* Instant Arrow Indicator */}
          <View style={styles.arrowCircle}>
            <Ionicons name="chevron-forward" size={18} color="#A090B8" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ChooseChildScreen() {
  const insets = useSafeAreaInsets();
  const { children } = useApp();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isUpload = mode === "upload";
  const isEdit   = mode === "edit";

  const title    = isUpload ? "Upload Drawing" : isEdit ? "Edit Child Profile" : "Start Drawing";
  const subtitle = isUpload
    ? "Choose the child whose drawing you'd like to upload and analyze"
    : isEdit
    ? "Select a child to edit their profile and information"
    : "Choose the child who will draw today";
  const btnIcon  = (isUpload ? "cloud-upload-outline" : isEdit ? "create-outline" : "brush-outline") as any;

  // ── 🚀 Instant Navigation Logic ──
  function handleNext(selectedId: string) {
    if (isUpload) {
      router.push({ pathname: "/add-drawing", params: { childId: selectedId } });
    } else if (isEdit) {
      router.push({ pathname: "/edit-child", params: { childId: selectedId } });
    } else {
      router.push({ pathname: "/drawing-canvas", params: { childId: selectedId } });
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#4A3070" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={isUpload ? ["#C4A8F5", "#D4B0F0"] : isEdit ? ["#D4B0F0", "#F0A8C8"] : ["#F0A8C8", "#C4A8F5"]}
          style={styles.headerIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={btnIcon} size={26} color="#fff" />
        </LinearGradient>
        <Text style={styles.headerTitle}>Select a Child</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      {/* Child list */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {children.length > 0 ? (
          children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onPress={handleNext}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient colors={["#F0E8FF", "#FDF8F5"]} style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={38} color="#C4B0FF" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Children Added</Text>
            <Text style={styles.emptyText}>Add a child from the Home screen first.</Text>
            <TouchableOpacity onPress={() => router.push("/add-child")} activeOpacity={0.85}>
              <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtn}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add Child</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  header: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 20, gap: 10 },
  headerIcon: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#4A3070", fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, color: "#A090B8", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19, maxWidth: 280 },
  scroll: { paddingHorizontal: 20, gap: 12, paddingTop: 4 },
  childCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 16, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 },
  childAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.13, shadowRadius: 8, elevation: 5 },
  avatarShine: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.24)", top: -6, left: -6 },
  avatarInitials: { fontSize: 20, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  childInfo: { flex: 1, gap: 4 },
  childName: { fontSize: 18, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  childMeta: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_400Regular" },
  arrowCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F7F5FA", alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, color: "#A090B8", fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 20 },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
});
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
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
  selected,
  onPress,
}: {
  child: Child;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 2 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40, bounciness: 6 }),
    ]).start();
    onPress();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <View style={[styles.childCard, selected && { borderColor: child.avatarColor, borderWidth: 2 }]}>
          {/* Avatar */}
          <LinearGradient
            colors={[child.avatarColor + "DD", child.avatarColor]}
            style={styles.childAvatar}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
          >
            <View style={styles.avatarShine} />
            <Text style={styles.avatarInitials}>{child.initials}</Text>
          </LinearGradient>

          {/* Info */}
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childMeta}>Age {child.age} · {child.gender}</Text>
          </View>

          {/* Check */}
          {selected ? (
            <LinearGradient
              colors={[child.avatarColor, child.avatarColor + "CC"]}
              style={styles.checkCircle}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
            </LinearGradient>
          ) : (
            <View style={styles.emptyCheck} />
          )}
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
  const [selected, setSelected] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isUpload = mode === "upload";
  const title    = isUpload ? "Upload Drawing" : "Start Drawing";
  const subtitle = isUpload
    ? "Choose the child whose drawing you'd like to upload and analyze"
    : "Choose the child who will draw today";
  const btnLabel = isUpload ? "Continue to Upload" : "Continue to Draw";
  const btnIcon  = isUpload ? "cloud-upload-outline" : "brush-outline";

  function handleNext() {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isUpload) {
      router.push({ pathname: "/add-drawing", params: { childId: selected } });
    } else {
      router.push({ pathname: "/drawing-canvas", params: { childId: selected } });
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A0F2E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={isUpload ? ["#5535E8", "#6C4DFF"] : ["#C084FC", "#7C3AED"]}
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
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {children.length > 0 ? (
          children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              selected={selected === child.id}
              onPress={() => setSelected(child.id)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient colors={["#EDE9FF", "#F5F1FF"]} style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={38} color="#B89CFF" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Children Added</Text>
            <Text style={styles.emptyText}>Add a child from the Home screen first.</Text>
            <TouchableOpacity onPress={() => router.push("/add-child")} activeOpacity={0.85}>
              <LinearGradient colors={["#6C4DFF", "#9B7FFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtn}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add Child</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      {children.length > 0 && (
        <View style={[styles.footer, { paddingBottom: botPad + 16 }]}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!selected}
            activeOpacity={0.88}
            style={{ width: "100%" }}
          >
            <LinearGradient
              colors={selected
                ? isUpload ? ["#5535E8", "#6C4DFF", "#9B7FFF"] : ["#C084FC", "#A855F7", "#7C3AED"]
                : ["#C0B0D8", "#D0C0E8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtn}
            >
              <Ionicons name={btnIcon} size={20} color="#fff" />
              <Text style={styles.continueBtnText}>{btnLabel}</Text>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F1FF" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#1A0F2E", fontFamily: "Inter_700Bold" },

  header: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 20, gap: 10 },
  headerIcon: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1A0F2E", fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, color: "#8B7BAB", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19, maxWidth: 280 },

  scroll: { paddingHorizontal: 20, gap: 12, paddingTop: 4 },

  childCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  childAvatar: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.13, shadowRadius: 8, elevation: 5 },
  avatarShine: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.24)", top: -6, left: -6 },
  avatarInitials: { fontSize: 20, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  childInfo: { flex: 1, gap: 4 },
  childName: { fontSize: 18, fontWeight: "700", color: "#1A0F2E", fontFamily: "Inter_700Bold" },
  childMeta: { fontSize: 12, color: "#8B7BAB", fontFamily: "Inter_400Regular" },
  checkCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emptyCheck: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#DDD6FF" },

  emptyState: { alignItems: "center", paddingTop: 40, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1A0F2E", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, color: "#8B7BAB", fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 20 },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },

  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#F5F1FF", borderTopWidth: 1, borderTopColor: "#EDE9FF" },
  continueBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17, borderRadius: 28, shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 10 },
  continueBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
});

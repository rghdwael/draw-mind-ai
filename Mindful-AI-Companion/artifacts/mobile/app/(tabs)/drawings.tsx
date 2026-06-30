import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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

const EMOTION_COLORS: Record<string, string> = {
  Happy:   "#90BE6D",
  Sad:     "#577590",
  Angry:   "#F3722C",
  Anxiety: "#F8961E",
  Fear:    "#C4B0FF",
};

// ── Child selection card ──────────────────────────────────────────────────────
function ChildRow({
  child,
  drawingCount,
  emotionSummary,
  index,
}: {
  child: Child;
  drawingCount: number;
  emotionSummary: string;
  index: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, []);

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 2 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40, bounciness: 6 }),
    ]).start(() => {
      router.push({ pathname: "/child-analysis", params: { childId: child.id } });
    });
  }

  const emotionColor = EMOTION_COLORS[emotionSummary.split(" ")[0]] ?? "#A78BFA";

  return (
    <Animated.View
      style={{
        opacity: mountAnim,
        transform: [
          { translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          { scale },
        ],
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <View style={styles.childRow}>
          {/* Left: colored avatar circle */}
          <LinearGradient
            colors={[child.avatarColor + "DD", child.avatarColor]}
            style={styles.childAvatar}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
          >
            <View style={styles.avatarShine} />
            <Text style={styles.avatarInitials}>{child.initials}</Text>
          </LinearGradient>

          {/* Middle: info */}
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childMeta}>Age {child.age} · {child.gender}</Text>
            <View style={styles.metaRow}>
              <View style={styles.drawingCountBadge}>
                <Ionicons name="brush-outline" size={11} color="#A090B8" />
                <Text style={styles.drawingCountText}>{drawingCount} drawing{drawingCount !== 1 ? "s" : ""}</Text>
              </View>
            </View>
          </View>

          {/* Right: arrow */}
          <View style={styles.arrowWrap}>
            <Ionicons name="chevron-forward" size={18} color="#B89CFF" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DrawingsScreen() {
  const insets = useSafeAreaInsets();
  const { children, drawings, getChildEmotionSummary } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: 110 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── قسم الهيدر المحدث بجمع الأيقونة والاسم أفقيًا ── */}
        <View style={styles.headerContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="people" size={24} color="#A78BFA" style={styles.headerIcon} />
            <Text style={styles.pageTitle}>Children</Text>
          </View>
          <Text style={styles.pageSubtitle}>Select a child to view their profile and drawings</Text>
        </View>

        {/* Child cards */}
        <View style={styles.list}>
          {children && children.length > 0 ? (
            children.map((child, i) => {
              const colorsPalette = ["#A78BFA", "#FF6B9D", "#48CAE4", "#F8961E", "#90BE6D", "#F3722C"];
              const assignedColor = child.avatarColor || colorsPalette[(child.name || "C").charCodeAt(0) % colorsPalette.length];
              
              const calculatedInitials = child.name 
                ? child.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) 
                : "CH";

              const enhancedChild = {
                ...child,
                avatarColor: assignedColor,
                initials: calculatedInitials 
              };

              return (
                <ChildRow
                  key={child.id}
                  child={enhancedChild}
                  index={i}
                  drawingCount={drawings.filter((d) => String(d.childId) === String(child.id)).length}
                  emotionSummary={getChildEmotionSummary ? getChildEmotionSummary(child.id) : "67% Happy"}
                />
              );
            })
          ) : null}

          {/* Add child card */}
          <TouchableOpacity
            onPress={() => router.push("/add-child")}
            activeOpacity={0.85}
          >
            <View style={styles.addRow}>
              <View style={styles.addCircle}>
                <Ionicons name="add" size={24} color="#A78BFA" />
              </View>
              <Text style={styles.addLabel}>Add a new child</Text>
              <Ionicons name="chevron-forward" size={18} color="#B89CFF" />
            </View>
          </TouchableOpacity>
        </View>

        {children.length === 0 && (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={["#F0E8FF", "#FDF8F5"]}
              style={styles.emptyIcon}
            >
              <Ionicons name="people-outline" size={40} color="#B89CFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: "#4A3070" }]}>No Children Added</Text>
            <Text style={styles.emptySubtitle}>
              Add your first child to start tracking their emotional development through drawings.
            </Text>
            <TouchableOpacity onPress={() => router.push("/add-child")} activeOpacity={0.85}>
              <LinearGradient
                colors={["#C4A8F5", "#F0A8C8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyBtn}
              >
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
  scroll: { paddingHorizontal: 20 },

  /* ستايلات حزمة الهيدر والمحاذاة المضافة حديثاً */
  headerContainer: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  headerIcon: {
    marginTop: 2, 
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#4A3070",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#A090B8",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  list: { gap: 12 },

  /* ── Child row card ── */
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#B89CFF",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  childAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarShine: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.25)",
    top: -7,
    left: -7,
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  childInfo: { flex: 1, gap: 4 },
  childName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4A3070",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  childMeta: {
    fontSize: 12,
    color: "#A090B8",
    fontFamily: "Inter_400Regular",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  drawingCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5ECF8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  drawingCountText: {
    fontSize: 11,
    color: "#A090B8",
    fontFamily: "Inter_500Medium",
  },
  emotionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  emotionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5ECF8",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Add row ── */
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
    borderColor: "#D8C4F5",
    borderStyle: "dashed",
  },
  addCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#A78BFA",
    fontFamily: "Inter_600SemiBold",
  },

  /* ── Empty state ── */
  emptyState: { alignItems: "center", paddingTop: 40, gap: 14 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A3070",
    fontFamily: "Inter_700Bold",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#A090B8",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 270,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 22,
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
});
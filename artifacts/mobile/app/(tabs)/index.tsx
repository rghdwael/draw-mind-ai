import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChildAvatar } from "@/components/ChildAvatar";
import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const QUICK_ACTIONS = [
  {
    icon: "cloud-upload",
    label: "Upload Drawing",
    sub: "Analyze a photo",
    gradientStart: "#6C4DFF",
    gradientEnd: "#9B7FFF",
    route: "/choose-child" as const,
  },
  {
    icon: "brush",
    label: "Draw",
    sub: "Create & analyze",
    gradientStart: "#B89CFF",
    gradientEnd: "#8B6BFF",
    route: "/choose-child" as const,
  },
];

function QuickActionCard({
  icon,
  label,
  sub,
  gradientStart,
  gradientEnd,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  gradientStart: string;
  gradientEnd: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <Animated.View style={[styles.qaWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.qaPressable}
      >
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.qaGradient}
        >
          {/* Decorative orb */}
          <View style={styles.qaOrb} />

          <View style={styles.qaIconWrap}>
            <Ionicons name={icon as any} size={26} color="rgba(255,255,255,0.95)" />
          </View>
          <Text style={styles.qaLabel}>{label}</Text>
          <Text style={styles.qaSub}>{sub}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userName, children, drawings, getChildEmotionSummary } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const happyPct =
    drawings.length > 0
      ? Math.round(
          (drawings.filter((d) =>
            d.mainEmotion.toLowerCase().includes("happy")
          ).length /
            drawings.length) *
            100
        )
      : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: 110 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting Card ── */}
        <LinearGradient
          colors={["#5535E8", "#6C4DFF", "#9B7FFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingCard}
        >
          {/* Background decorative orbs */}
          <View style={styles.greetingOrb1} />
          <View style={styles.greetingOrb2} />

          <View style={styles.greetingTop}>
            <View style={styles.greetingLeft}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.greetingName}>{userName}</Text>
              <Text style={styles.greetingSubtitle}>
                Track your children's emotions
              </Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {userName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Inline Stats */}
          <View style={styles.greetingStats}>
            <View style={styles.greetingStat}>
              <Text style={styles.greetingStatNum}>{children.length}</Text>
              <Text style={styles.greetingStatLabel}>Children</Text>
            </View>
            <View style={styles.greetingStatDivider} />
            <View style={styles.greetingStat}>
              <Text style={styles.greetingStatNum}>{drawings.length}</Text>
              <Text style={styles.greetingStatLabel}>Drawings</Text>
            </View>
            <View style={styles.greetingStatDivider} />
            <View style={styles.greetingStat}>
              <Text style={styles.greetingStatNum}>{happyPct}%</Text>
              <Text style={styles.greetingStatLabel}>Happy</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── My Children ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Children</Text>
            <TouchableOpacity
              onPress={() => router.push("/add-child")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAll}>Manage</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childrenRow}
          >
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/child-analysis",
                    params: { childId: child.id },
                  });
                }}
                style={styles.childItem}
                activeOpacity={0.8}
              >
                {/* Glow ring */}
                <View
                  style={[
                    styles.childGlowRing,
                    { borderColor: child.avatarColor + "55" },
                  ]}
                >
                  <ChildAvatar
                    name={child.name}
                    initials={child.initials}
                    avatarColor={child.avatarColor}
                    size={68}
                    showName={false}
                  />
                </View>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.emotionBadge}>
                  {getChildEmotionSummary(child.id)}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Add Child */}
            <TouchableOpacity
              onPress={() => router.push("/add-child")}
              style={styles.childItem}
              activeOpacity={0.8}
            >
              <View style={styles.addChildRing}>
                <View style={styles.addChildCircle}>
                  <Ionicons name="add" size={28} color="#6C4DFF" />
                </View>
              </View>
              <Text style={styles.childName}>Add Child</Text>
              <Text style={styles.emotionBadgePlaceholder}> </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Drawings</Text>
          <View style={styles.qaGrid}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard
                key={action.label}
                icon={action.icon}
                label={action.label}
                sub={action.sub}
                gradientStart={action.gradientStart}
                gradientEnd={action.gradientEnd}
                onPress={() => router.push(action.route as any)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1FF",
  },
  scroll: {
    paddingHorizontal: 20,
  },

  /* ── Greeting ── */
  greetingCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 14,
  },
  greetingOrb1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -40,
    right: -30,
  },
  greetingOrb2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: 20,
  },
  greetingTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greetingLeft: { flex: 1 },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginVertical: 3,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },

  /* Stats inside greeting */
  greetingStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  greetingStat: {
    flex: 1,
    alignItems: "center",
  },
  greetingStatNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  greetingStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  greetingStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  /* ── Section ── */
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },

  /* ── My Children ── */
  childrenRow: {
    gap: 20,
    paddingHorizontal: 4,
    paddingBottom: 6,
    alignItems: "flex-start",
  },
  childItem: {
    alignItems: "center",
    gap: 6,
  },
  childGlowRing: {
    borderRadius: 40,
    borderWidth: 2.5,
    padding: 3,
  },
  childName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A0F2E",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emotionBadge: {
    fontSize: 11,
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  emotionBadgePlaceholder: {
    fontSize: 11,
    color: "transparent",
  },
  addChildRing: {
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: "#DDD6FF",
    borderStyle: "dashed",
    padding: 3,
  },
  addChildCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Quick Actions Grid ── */
  qaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  qaWrap: {
    width: "47.5%",
  },
  qaPressable: {
    borderRadius: 24,
    overflow: "hidden",
  },
  qaGradient: {
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 10,
    overflow: "hidden",
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
    minHeight: 130,
    justifyContent: "flex-end",
  },
  qaOrb: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -20,
    right: -20,
  },
  qaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  qaLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  qaSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    fontFamily: "Inter_400Regular",
  },
});

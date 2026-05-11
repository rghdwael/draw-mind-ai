import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChildAvatar } from "@/components/ChildAvatar";
import { useApp } from "@/context/AppContext";
import type { Child, Drawing } from "@/context/AppContext";

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

// ── Mini sparkline chart using react-native-svg ──────────────────────────────
function SparklineChart({ emotionData, activityData }: { emotionData: number[]; activityData: number[] }) {
  const W = 300;
  const H = 90;
  const pad = 8;

  function makeSmooth(data: number[]): string {
    const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (W - pad * 2));
    const ys = data.map((v) => H - pad - (v / 100) * (H - pad * 2));
    if (xs.length < 2) return "";
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cpx = (xs[i - 1] + xs[i]) / 2;
      d += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
    }
    return d;
  }

  function makeArea(data: number[]): string {
    const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (W - pad * 2));
    const ys = data.map((v) => H - pad - (v / 100) * (H - pad * 2));
    let d = `M ${xs[0]} ${H}`;
    d += ` L ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cpx = (xs[i - 1] + xs[i]) / 2;
      d += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
    }
    d += ` L ${xs[xs.length - 1]} ${H} Z`;
    return d;
  }

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <SvgGradient id="emotionGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF6B9D" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#FF6B9D" stopOpacity="0" />
        </SvgGradient>
        <SvgGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6C4DFF" stopOpacity="0.2" />
          <Stop offset="1" stopColor="#6C4DFF" stopOpacity="0" />
        </SvgGradient>
      </Defs>
      {/* Area fills */}
      <Path d={makeArea(emotionData)} fill="url(#emotionGrad)" />
      <Path d={makeArea(activityData)} fill="url(#activityGrad)" />
      {/* Lines */}
      <Path d={makeSmooth(activityData)} fill="none" stroke="#6C4DFF" strokeWidth="2.5" strokeLinecap="round" />
      <Path d={makeSmooth(emotionData)} fill="none" stroke="#FF6B9D" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// ── Expanded child summary card ───────────────────────────────────────────────
function ExpandedChildCard({
  child,
  drawings,
  visible,
}: {
  child: Child;
  drawings: Drawing[];
  visible: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 5 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 5 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -12, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.97, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const childDrawings = drawings.filter((d) => d.childId === child.id);
  const happyCount = childDrawings.filter((d) => d.mainEmotion.toLowerCase().includes("happy")).length;
  const sadCount = childDrawings.filter((d) => d.mainEmotion.toLowerCase().includes("sad")).length;
  const happyPct = childDrawings.length > 0 ? Math.round((happyCount / childDrawings.length) * 100) : 75;
  const sadPct = childDrawings.length > 0 ? Math.round((sadCount / childDrawings.length) * 100) : 25;

  // Generate mock weekly sparkline data seeded per child
  const seed = child.name.charCodeAt(0);
  const emotionData = [60, 55, 70, 65, 80, 75, happyPct || 78].map(
    (v, i) => Math.min(100, Math.max(20, v + ((seed * (i + 1)) % 15) - 7))
  );
  const activityData = [40, 55, 48, 62, 58, 70, 65].map(
    (v, i) => Math.min(100, Math.max(10, v + ((seed * (i + 2)) % 12) - 5))
  );

  const insightText = `${child.name} is showing consistent improvement in emotional expression this week.`;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.expandedCard,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      {/* Header */}
      <View style={styles.expandedHeader}>
        <ChildAvatar
          name={child.name}
          initials={child.initials}
          avatarColor={child.avatarColor}
          size={44}
          showName={false}
        />
        <View style={styles.expandedHeaderText}>
          <Text style={styles.expandedTitle}>{child.name}'s Progress</Text>
          <Text style={styles.expandedSub}>Weekly emotional overview</Text>
        </View>
        <View style={[styles.expandedBadge, { backgroundColor: child.avatarColor + "22" }]}>
          <Text style={[styles.expandedBadgeText, { color: child.avatarColor }]}>
            Age {child.age}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF6B9D" }]} />
            <Text style={styles.legendLabel}>Emotion</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#6C4DFF" }]} />
            <Text style={styles.legendLabel}>Activity</Text>
          </View>
        </View>
        <View style={styles.chartInner}>
          <SparklineChart emotionData={emotionData} activityData={activityData} />
          <View style={styles.chartXLabels}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <Text key={d} style={styles.chartXLabel}>{d}</Text>
            ))}
          </View>
        </View>
      </View>

      {/* AI Insight */}
      <View style={styles.insightCard}>
        <View style={styles.insightIconWrap}>
          <Ionicons name="sparkles" size={16} color="#6C4DFF" />
        </View>
        <Text style={styles.insightText}>{insightText}</Text>
      </View>

      {/* Emotion Pills */}
      <View style={styles.pillsRow}>
        <View style={[styles.pill, { backgroundColor: "#FFF0F6" }]}>
          <View style={[styles.pillDot, { backgroundColor: "#FF6B9D" }]} />
          <Text style={[styles.pillText, { color: "#FF6B9D" }]}>{happyPct}% Happy</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: "#EEF0FF" }]}>
          <View style={[styles.pillDot, { backgroundColor: "#6C7FFF" }]} />
          <Text style={[styles.pillText, { color: "#6C7FFF" }]}>{sadPct}% Sad</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: "#F0EDFF" }]}>
          <Ionicons name="image-outline" size={12} color="#6C4DFF" />
          <Text style={[styles.pillText, { color: "#6C4DFF" }]}>{childDrawings.length} Drawings</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.expandedActions}>
        <TouchableOpacity
          style={styles.expandedActionBtn}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/choose-child");
          }}
        >
          <LinearGradient
            colors={["#6C4DFF", "#9B7FFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.expandedActionGrad}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            <Text style={styles.expandedActionLabel}>Upload Drawing</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.expandedActionBtn}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/choose-child");
          }}
        >
          <LinearGradient
            colors={["#B89CFF", "#7C5FFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.expandedActionGrad}
          >
            <Ionicons name="brush-outline" size={18} color="#fff" />
            <Text style={styles.expandedActionLabel}>Draw</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
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
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 40, bounciness: 4 }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

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

// ── Home Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userName, children, drawings, getChildEmotionSummary } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  function handleChildPress(childId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChildId((prev) => (prev === childId ? null : childId));
  }

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
            {children.map((child) => {
              const isSelected = selectedChildId === child.id;
              return (
                <TouchableOpacity
                  key={child.id}
                  onPress={() => handleChildPress(child.id)}
                  style={styles.childItem}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.childGlowRing,
                      {
                        borderColor: isSelected ? child.avatarColor : child.avatarColor + "55",
                        borderWidth: isSelected ? 3 : 2.5,
                        backgroundColor: isSelected ? child.avatarColor + "18" : "transparent",
                      },
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
                  <Text style={[styles.childName, isSelected && { color: "#6C4DFF" }]}>
                    {child.name}
                  </Text>
                  <Text style={styles.emotionBadge}>
                    {getChildEmotionSummary(child.id)}
                  </Text>
                </TouchableOpacity>
              );
            })}

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

          {/* Expanded summary cards — one per child, toggled */}
          {children.map((child) => (
            <ExpandedChildCard
              key={child.id}
              child={child}
              drawings={drawings}
              visible={selectedChildId === child.id}
            />
          ))}
        </View>

        {/* ── Recent Drawings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleStandalone}>Recent Drawings</Text>
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
  container: { flex: 1, backgroundColor: "#F5F1FF" },
  scroll: { paddingHorizontal: 20 },

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

  /* ── Section ── */
  section: { marginBottom: 28 },
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
  sectionTitleStandalone: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    marginBottom: 20,
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
  childItem: { alignItems: "center", gap: 6 },
  childGlowRing: {
    borderRadius: 40,
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
  emotionBadgePlaceholder: { fontSize: 11, color: "transparent" },
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

  /* ── Expanded Child Card ── */
  expandedCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(108,77,255,0.08)",
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  expandedHeaderText: { flex: 1 },
  expandedTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  expandedSub: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  expandedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  expandedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  /* Chart */
  chartContainer: {
    backgroundColor: "#F9F7FF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },
  chartLegend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: {
    fontSize: 11,
    color: "#8B7BAB",
    fontFamily: "Inter_500Medium",
  },
  chartInner: { alignItems: "center" },
  chartXLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 300,
    marginTop: 4,
  },
  chartXLabel: {
    fontSize: 9,
    color: "#B0A0CC",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    flex: 1,
  },

  /* AI Insight */
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F0EDFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  insightIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#E4DDFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: "#3D2A6E",
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },

  /* Emotion Pills */
  pillsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  /* Expanded Action Buttons */
  expandedActions: { flexDirection: "row", gap: 10 },
  expandedActionBtn: { flex: 1, borderRadius: 16, overflow: "hidden" },
  expandedActionGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    borderRadius: 16,
  },
  expandedActionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },

  /* ── Quick Actions Grid ── */
  qaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  qaWrap: { width: "47.5%" },
  qaPressable: { borderRadius: 24, overflow: "hidden" },
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

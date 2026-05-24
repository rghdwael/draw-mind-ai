import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { Child } from "@/context/AppContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// ── Sparkline chart ───────────────────────────────────────────────────────────
function SparklineChart({
  emotionData,
  activityData,
  width,
}: {
  emotionData: number[];
  activityData: number[];
  width: number;
}) {
  const H = 100;
  const pad = 10;

  function smooth(data: number[]): string {
    const xs = data.map(
      (_, i) => pad + (i / (data.length - 1)) * (width - pad * 2)
    );
    const ys = data.map(
      (v) => H - pad - (v / 100) * (H - pad * 2)
    );
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cx = (xs[i - 1] + xs[i]) / 2;
      d += ` C ${cx} ${ys[i - 1]}, ${cx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
    }
    return d;
  }

  function area(data: number[]): string {
    const xs = data.map(
      (_, i) => pad + (i / (data.length - 1)) * (width - pad * 2)
    );
    const ys = data.map(
      (v) => H - pad - (v / 100) * (H - pad * 2)
    );
    let d = `M ${xs[0]} ${H} L ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cx = (xs[i - 1] + xs[i]) / 2;
      d += ` C ${cx} ${ys[i - 1]}, ${cx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
    }
    d += ` L ${xs[xs.length - 1]} ${H} Z`;
    return d;
  }

  return (
    <Svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
      <Defs>
        <SvgGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF6B9D" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#FF6B9D" stopOpacity="0" />
        </SvgGradient>
        <SvgGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C4A8F5" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#C4A8F5" stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path d={area(activityData)} fill="url(#aGrad)" />
      <Path d={area(emotionData)} fill="url(#eGrad)" />
      <Path
        d={smooth(activityData)}
        fill="none"
        stroke="#A78BFA"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d={smooth(emotionData)}
        fill="none"
        stroke="#FF6B9D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Circular Child Avatar ─────────────────────────────────────────────────────
function ChildCircle({
  child,
  selected,
  onTap,
}: {
  child: Child;
  selected: boolean;
  onTap: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  const colorsPalette = ["#A78BFA", "#FF6B9D", "#48CAE4", "#F8961E", "#90BE6D", "#F3722C"];
  const avatarColor = child.avatarColor || colorsPalette[(child.name || "C").charCodeAt(0) % colorsPalette.length];
  const initials = child.name ? child.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "CH";

  useEffect(() => {
    Animated.spring(ringAnim, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
    }).start();
  }, [selected]);

  function handlePress() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 55, bounciness: 2 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 10 }),
    ]).start();
    onTap();
  }

  const ringOpacity = ringAnim;
  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.circleWrap}>
      <Animated.View
        style={[
          styles.circleGlowRing,
          {
            borderColor: avatarColor,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
            shadowColor: avatarColor,
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={[avatarColor + "DD", avatarColor]}
          style={styles.circleAvatar}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
        >
          <View style={styles.circleShine} />
          <Text style={styles.circleInitials}>{initials}</Text>
        </LinearGradient>
      </Animated.View>
      <Text
        style={[
          styles.circleName,
          selected ? { color: "#A78BFA", fontWeight: "700" } : null,
        ]}
        numberOfLines={1}
      >
        {child.name}
      </Text>
      {selected && (
        <View style={[styles.circleSelectedDot, { backgroundColor: avatarColor }]} />
      )}
    </TouchableOpacity>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({
  icon,
  label,
  sub,
  colors,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  colors: [string, string, ...string[]];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[styles.actionBtnWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
          onPress();
        }}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 40,
            bounciness: 3,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
          }).start()
        }
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionBtn}
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name={icon as any} size={24} color="#fff" />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionLabel}>{label}</Text>
            <Text style={styles.actionSub}>{sub}</Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={18}
            color="rgba(255,255,255,0.6)"
          />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userName, children, drawings } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [progressVisible, setProgressVisible] = useState(true);
  const [clearedToast, setClearedToast] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(String(children[0].id));
    }
  }, [children]);

  const selectedChild = useMemo(() => {
    if (!selectedChildId && children.length > 0) return children[0];
    return children.find((c) => String(c.id) === String(selectedChildId));
  }, [selectedChildId, children]);

  // ✅ تعديل d.childId لمطابقة الـ Front-end وسحق الـ Type Error المتبقي
  const childDrawings = useMemo(() => {
    if (!selectedChild) return [];
    const targetId = String(selectedChild.id);
    return drawings.filter((d) => String(d.childId) === targetId);
  }, [drawings, selectedChild]);

  const happyPct = useMemo(() => {
    if (!childDrawings.length) return 78;
    const happy = childDrawings.filter((d) =>
      d.mainEmotion?.toLowerCase().includes("happy") || d.mainEmotion?.toLowerCase().includes("happiness")
    ).length;
    return Math.round((happy / childDrawings.length) * 100);
  }, [childDrawings]);

  const seed = selectedChild ? (selectedChild.name || "C").charCodeAt(0) : 65;
  const emotionData = [60, 55, 70, 65, 80, 75, happyPct].map((v, i) =>
    Math.min(100, Math.max(20, v + ((seed * (i + 1)) % 15) - 7))
  );
  const activityData = [40, 55, 48, 62, 58, 70, 65].map((v, i) =>
    Math.min(100, Math.max(10, v + ((seed * (i + 2)) % 12) - 5))
  );

  const fadeGreet = useRef(new Animated.Value(0)).current;
  const fadeChildren = useRef(new Animated.Value(0)).current;
  const fadeChart = useRef(new Animated.Value(0)).current;
  const fadeInsight = useRef(new Animated.Value(0)).current;
  const fadeActions = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(fadeGreet, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(fadeChildren, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(fadeChart, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(fadeInsight, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(fadeActions, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const chartFade = useRef(new Animated.Value(1)).current;
  const prevId = useRef<string | null>(null);
  useEffect(() => {
    if (prevId.current !== null && prevId.current !== selectedChildId) {
      Animated.sequence([
        Animated.timing(chartFade, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(chartFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
    prevId.current = selectedChildId;
  }, [selectedChildId]);

  function showProgress() {
    setProgressVisible(true);
    Animated.spring(progressAnim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 5 }).start();
  }

  function hideProgress() {
    Animated.timing(progressAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
      setProgressVisible(false);
    });
    setClearedToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => setClearedToast(false));
  }

  function handleTap(id: string) {
    const currentActiveId = selectedChildId;
    if (id !== currentActiveId) {
      setSelectedChildId(id);
      if (!progressVisible) showProgress();
    } else {
      if (progressVisible) {
        hideProgress();
      } else {
        showProgress();
      }
    }
  }

  const insightText = selectedChild
    ? `${selectedChild.name} is showing consistent improvement in emotional expression this week.`
    : "Select a child to view their emotional insights.";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: 110 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <Animated.View style={{ opacity: fadeGreet, transform: [{ translateY: fadeGreet.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <LinearGradient
            colors={["#C4A8F5", "#D4B0F0", "#F0B8D8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <View style={styles.welcomeOrb1} />
            <View style={styles.welcomeOrb2} />
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeGreeting}>{getGreeting()}</Text>
              <Text style={styles.welcomeName}>{userName}</Text>
              <Text style={styles.welcomeSub}>Let's check in on your children today</Text>
              <View style={styles.welcomeChip}>
                <View style={styles.welcomeChipDot} />
                <Text style={styles.welcomeChipText}>
                  {children.length} children · {drawings.length} drawings
                </Text>
              </View>
            </View>
            <View style={styles.welcomeRight}>
              <Image source={require("@/assets/images/whale-heart.png")} style={styles.mascotImage} resizeMode="contain" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* My Children */}
        <Animated.View style={{ opacity: fadeChildren, transform: [{ translateY: fadeChildren.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Children</Text>
            <TouchableOpacity onPress={() => router.push("/add-child")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.seeAll}>Manage</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childrenScrollRow}>
            {children && children.length > 0 && children.map((child) => {
              const itemId = String(child.id);
              return (
                <ChildCircle
                  key={itemId}
                  child={child}
                  selected={selectedChildId === itemId}
                  onTap={() => handleTap(itemId)}
                />
              );
            })}

            <TouchableOpacity onPress={() => router.push("/add-child")} style={styles.addCircleButton}>
              <View style={styles.addCircleDash}>
                <Ionicons name="add" size={28} color="#C4A8F5" />
              </View>
              <Text style={styles.addCircleText}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Cleared Toast */}
        {clearedToast && (
          <Animated.View pointerEvents="none" style={[styles.clearedToast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
            <Ionicons name="checkmark-circle" size={16} color="#A78BFA" />
            <Text style={styles.clearedToastText}>Analysis hidden — tap again to restore</Text>
          </Animated.View>
        )}

        {/* Progress Chart */}
        {selectedChild && progressVisible && (
          <Animated.View style={{ opacity: Animated.multiply(Animated.multiply(fadeChart, chartFade), progressAnim), transform: [{ translateY: fadeChart.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{selectedChild.name}'s Progress</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: "/child-analysis", params: { childId: String(selectedChild.id) } })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#FF6B9D" }]} />
                  <Text style={styles.legendLabel}>Emotion</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#A78BFA" }]} />
                  <Text style={styles.legendLabel}>Activity</Text>
                </View>
              </View>

              <View style={styles.chartBody}>
                <SparklineChart emotionData={emotionData} activityData={activityData} width={320} />
                <View style={styles.chartDayRow}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <Text key={d} style={styles.chartDay}>{d}</Text>
                  ))}
                </View>
              </View>

              <View style={styles.chartStats}>
                <View style={styles.chartStatChip}>
                  <Text style={styles.chartStatNum}>{happyPct}%</Text>
                  <Text style={styles.chartStatLabel}>Happy</Text>
                </View>
                <View style={[styles.chartStatChip, styles.chartStatChipMid]}>
                  <Text style={styles.chartStatNum}>{childDrawings.length}</Text>
                  <Text style={styles.chartStatLabel}>Drawings</Text>
                </View>
                <View style={styles.chartStatChip}>
                  <Text style={styles.chartStatNum}>{selectedChild.age}y</Text>
                  <Text style={styles.chartStatLabel}>Age</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* AI Insight */}
        {selectedChild && progressVisible && (
          <Animated.View style={{ opacity: Animated.multiply(Animated.multiply(fadeInsight, chartFade), progressAnim), transform: [{ translateY: fadeInsight.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }}>
            <View style={styles.insightCard}>
              <LinearGradient colors={["#F5ECF8", "#FDF8F5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.insightGradient}>
                <View style={styles.insightHeader}>
                  <View style={styles.insightIconWrap}>
                    <Ionicons name="sparkles" size={16} color="#A78BFA" />
                  </View>
                  <Text style={styles.insightHeading}>AI Insight</Text>
                </View>
                <Text style={styles.insightText}>{insightText}</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: "/child-analysis", params: { childId: String(selectedChild.id) } })}>
                  <Text style={styles.insightLinkText}>View full analysis</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View style={{ opacity: fadeActions, transform: [{ translateY: fadeActions.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Recent Drawings</Text>
          <View style={styles.actionsCol}>
            <ActionBtn icon="cloud-upload-outline" label="Upload Drawing" sub="Analyze from your camera roll" colors={["#C4A8F5", "#D4B0F0", "#E8B8D8"]} onPress={() => router.push({ pathname: "/choose-child", params: { mode: "upload" } })} />
            <ActionBtn icon="brush-outline" label="Draw" sub="Create a new drawing to analyze" colors={["#F0A8C8", "#E0A0D8", "#C4A8F5"]} onPress={() => router.push({ pathname: "/choose-child", params: { mode: "draw" } })} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  scroll: { paddingHorizontal: 20 },
  welcomeCard: { borderRadius: 32, paddingTop: 24, paddingBottom: 0, paddingHorizontal: 24, marginBottom: 28, overflow: "hidden", flexDirection: "row", alignItems: "flex-end", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.4, shadowRadius: 28, elevation: 14, minHeight: 160 },
  welcomeOrb1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.3)", top: -50, right: -30 },
  welcomeOrb2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.2)", bottom: 10, left: -20 },
  welcomeLeft: { flex: 1, paddingBottom: 24 },
  welcomeGreeting: { fontSize: 13, color: "rgba(74,48,112,0.72)", fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
  welcomeName: { fontSize: 26, fontWeight: "800", color: "#4A3070", fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginTop: 3, marginBottom: 5 },
  welcomeSub: { fontSize: 12, color: "rgba(74,48,112,0.62)", fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 14 },
  welcomeChip: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.45)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  welcomeChipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#A8EDBB" },
  welcomeChipText: { fontSize: 11, color: "rgba(74,48,112,0.88)", fontFamily: "Inter_500Medium" },
  welcomeRight: { width: 110, alignItems: "center", justifyContent: "flex-end" },
  mascotImage: { width: 110, height: 130 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  seeAll: { fontSize: 13, color: "#A78BFA", fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  childrenScrollRow: { flexDirection: "row", gap: 16, paddingVertical: 8, paddingHorizontal: 4, marginBottom: 24 },
  circleWrap: { alignItems: "center", width: 72, marginRight: 4 },
  circleGlowRing: { position: "absolute", top: -5, left: -5, width: 82, height: 82, borderRadius: 41, borderWidth: 2.5 },
  circleAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  circleShine: { position: "absolute", width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.22)", top: -8, left: -8 },
  circleInitials: { fontSize: 22, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  circleName: { fontSize: 11, fontWeight: "600", color: "#7A6090", fontFamily: "Inter_600SemiBold", textAlign: "center", marginTop: 8 },
  circleSelectedDot: { width: 7, height: 7, borderRadius: 4, marginTop: 4 },
  addCircleButton: { alignItems: "center", gap: 8, marginLeft: 4 },
  addCircleDash: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#C4A8F5", borderStyle: "dashed" },
  addCircleText: { fontSize: 11, color: "#A090B8", fontWeight: "600", fontFamily: "Inter_600SemiBold", marginTop: 8 },
  clearedToast: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF5F8", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 14, alignSelf: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 6, borderWidth: 1, borderColor: "#EAD4F5" },
  clearedToastText: { fontSize: 12, color: "#7A6090", fontFamily: "Inter_500Medium" },
  chartCard: { backgroundColor: "#FFF5F8", borderRadius: 28, padding: 20, marginBottom: 16, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 20, elevation: 6 },
  chartCardBg: { flex: 1 },
  chartLegend: { flexDirection: "row", gap: 18, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_500Medium" },
  chartBody: { alignItems: "center" },
  // 💡 تم تصحيح justifyContent هنا للتخلص من الـ Type Error القاتل
  chartDayRow: { flexDirection: "row", justifyContent: "space-between", width: 320, marginTop: 6, paddingHorizontal: 4 },
  chartDay: { fontSize: 9, color: "#C0B0D8", fontFamily: "Inter_400Regular", textAlign: "center", flex: 1 },
  chartStats: { flexDirection: "row", marginTop: 16, borderTopWidth: 1, borderTopColor: "#F0ECFF", paddingTop: 14 },
  chartStatChip: { flex: 1, alignItems: "center" },
  chartStatChipMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#F0ECFF" },
  chartStatNum: { fontSize: 20, fontWeight: "800", color: "#A78BFA", fontFamily: "Inter_700Bold" },
  chartStatLabel: { fontSize: 11, color: "#B0A0CC", fontFamily: "Inter_400Regular", marginTop: 2 },
  insightCard: { borderRadius: 24, overflow: "hidden", marginBottom: 28, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  insightGradient: { borderRadius: 24, padding: 18, borderWidth: 1.5, borderColor: "rgba(196,168,245,0.25)" },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  insightIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#F0E8FF", alignItems: "center", justifyContent: "center" },
  insightHeading: { fontSize: 14, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  insightText: { fontSize: 13, color: "#7A6090", fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 12 },
  insightLink: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start" },
  insightLinkText: { fontSize: 12, fontWeight: "700", color: "#A78BFA", fontFamily: "Inter_700Bold" },
  actionsCol: { gap: 12 },
  actionBtnWrap: { borderRadius: 22, overflow: "hidden" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18, paddingHorizontal: 20, borderRadius: 22, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 10 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  actionTextWrap: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  actionSub: { fontSize: 11, color: "rgba(255,255,255,0.68)", fontFamily: "Inter_400Regular", marginTop: 2 },
});
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
  Circle,
  Text as SvgText,
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

// ── Sparkline chart ────────────────────────────────────────────────────────
function SparklineChart({
  emotionData,
  activityData,
  dailyDominantLabels,
  width,
  selectedIndex,
  onSelectIndex, // 🚨 Added this!
}: {
  emotionData: number[];
  activityData: number[];
  dailyDominantLabels: string[];
  width: number;
  selectedIndex: number | null;
  onSelectIndex: (i: number | null) => void; // 🚨 Added this!
}) {
  const H = 115; 
  const pad = 10;

  const xs = useMemo(() => 
    emotionData.map((_, i) => pad + (i / (emotionData.length - 1)) * (width - pad * 2)),
    [emotionData, width]
  );

  const ys = useMemo(() => 
    emotionData.map((v) => H - pad - (v / 100) * (H - pad * 2 - 15)),
    [emotionData]
  );

  function smooth(data: number[]): string {
    const localYs = data.map((v) => H - pad - (v / 100) * (H - pad * 2 - 15));
    let d = `M ${xs[0]} ${localYs[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cx = (xs[i - 1] + xs[i]) / 2;
      d += ` C ${cx} ${localYs[i - 1]}, ${cx} ${localYs[i]}, ${xs[i]} ${localYs[i]}`;
    }
    return d;
  }

  function area(data: number[]): string {
    const localYs = data.map((v) => H - pad - (v / 100) * (H - pad * 2 - 15));
    let d = `M ${xs[0]} ${H} L ${xs[0]} ${localYs[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cx = (xs[i - 1] + xs[i]) / 2;
      d += ` C ${cx} ${localYs[i - 1]}, ${cx} ${localYs[i]}, ${xs[i]} ${localYs[i]}`;
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
      <Path d={smooth(activityData)} fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
      <Path d={smooth(emotionData)} fill="none" stroke="#FF6B9D" strokeWidth="2.5" strokeLinecap="round" />

      {/* 🚨 INVISIBLE HIT AREA: Big circles so it's easy to tap */}
      {xs.map((x, i) => (
        <Circle 
          key={`touch-${i}`} 
          cx={x} cy={ys[i]} r={16} 
          fill="transparent" 
          onPress={() => onSelectIndex(selectedIndex === i ? null : i)} 
        />
      ))}

      {/* 🚨 VISIBLE DOTS */}
      {xs.map((x, i) => (
        <Circle 
          key={`vis-${i}`} 
          cx={x} cy={ys[i]} 
          r={selectedIndex === i ? 8 : 4} 
          fill={selectedIndex === i ? "#FF6B9D" : "#fff"} 
          stroke="#FF6B9D" strokeWidth={2} 
          pointerEvents="none" 
        />
      ))}
    </Svg>
  );
}

// ── Circular Child Avatar ─────────────────────────────────────────────────────
function ChildCircle({ child, selected, onTap }: { child: Child; selected: boolean; onTap: () => void; }) {
  const scale = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  const colorsPalette = ["#A78BFA", "#FF6B9D", "#48CAE4", "#F8961E", "#90BE6D", "#F3722C"];
  const avatarColor = child.avatarColor || colorsPalette[(child.name || "C").charCodeAt(0) % colorsPalette.length];
  const initials = child.name ? child.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "CH";

  useEffect(() => {
    Animated.spring(ringAnim, { toValue: selected ? 1 : 0, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
  }, [selected]);

  function handlePress() {
    if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); }
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 55, bounciness: 2 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 10 }),
    ]).start();
    onTap();
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.circleWrap}>
      <Animated.View style={[styles.circleGlowRing, { borderColor: avatarColor, opacity: ringAnim, transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }], shadowColor: avatarColor }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={[avatarColor + "DD", avatarColor]} style={styles.circleAvatar} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}>
          <View style={styles.circleShine} />
          <Text style={styles.circleInitials}>{initials}</Text>
        </LinearGradient>
      </Animated.View>
      <Text style={[styles.circleName, selected ? { color: "#A78BFA", fontWeight: "700" } : null]} numberOfLines={1}>{child.name}</Text>
      {selected && <View style={[styles.circleSelectedDot, { backgroundColor: avatarColor }]} />}
    </TouchableOpacity>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, sub, colors, onPress }: { icon: string; label: string; sub: string; colors: [string, string, ...string[]]; onPress: () => void; }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.actionBtnWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => { if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } onPress(); }}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 3 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start()}
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBtn}>
          <View style={styles.actionIconWrap}><Ionicons name={icon as any} size={24} color="#fff" /></View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionLabel}>{label}</Text>
            <Text style={styles.actionSub}>{sub}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.6)" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  // 🚨 Added fetchDrawings to trigger database pull
  const { userName, children, drawings, fetchDrawings } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [progressVisible, setProgressVisible] = useState(true);
  const [clearedToast, setClearedToast] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      setSelectedChildId(String(children[0].id));
    }
  }, [children]);

  // 🚨 Automatically fetch drawings when Home loads
  useEffect(() => {
    if (selectedChildId && fetchDrawings) {
      fetchDrawings(selectedChildId);
    }
  }, [selectedChildId]);

  const selectedChild = useMemo(() => {
    if (!selectedChildId && children.length > 0) return children[0];
    return children.find((c) => String(c.id) === String(selectedChildId));
  }, [selectedChildId, children]);

  const childDrawings = useMemo(() => {
    if (!selectedChild) return [];
    const targetId = String(selectedChild.id);
    // 🚨 ADDED : any to bypass TypeScript rulebook
    return drawings.filter((d: any) => String(d.childId || d.child_id) === targetId);
  }, [drawings, selectedChild]);

  // REAL-DATA MATH ENGINE
  const emotionBreakdown = useMemo(() => {
    if (!childDrawings.length) return { happy: 0, sad: 0, angry: 0, fear: 0, mixed: 0 };
    let happy = 0, sad = 0, angry = 0, fear = 0, mixed = 0;

    // 🚨 ADDED : any to bypass TypeScript rulebook
    childDrawings.forEach((d: any) => {
      const status = (d?.analysis?.emotional_status || "").toLowerCase();
      
      if (status.includes("mix")) {
        mixed++;
      } else {
        if (status.includes("happ") || status.includes("joy") || status.includes("positiv")) happy++;
        if (status.includes("sad")) sad++;
        if (status.includes("ang") || status.includes("frustrat")) angry++;
        if (status.includes("fear") || status.includes("anxi") || status.includes("scare") || status.includes("worr")) fear++;
      }
    });

    const total = childDrawings.length;
    return {
      happy: Math.round((happy / total) * 100),
      sad: Math.round((sad / total) * 100),
      angry: Math.round((angry / total) * 100),
      fear: Math.round((fear / total) * 100),
      mixed: Math.round((mixed / total) * 100),
    };
  }, [childDrawings]);

  const happyPct = emotionBreakdown.happy;

  // SMART RED DISTRESS BOX LOGIC
  const childStatusEvaluation = useMemo(() => {
    if (!childDrawings.length) {
      return {
        isDanger: false,
        title: "No Data Available",
        description: "Upload drawings to start the real-time psychological emotional mapping.",
      };
    }

    const { sad, angry, fear } = emotionBreakdown;
    const totalNegative = sad + angry + fear;

    if (totalNegative >= 50) {
      let dominantNegative = "Sadness";
      if (angry > sad && angry > fear) dominantNegative = "Anger";
      if (fear > sad && fear > angry) dominantNegative = "Fear";

      return {
        isDanger: true,
        title: "Emotional Distress Signal Detected",
        description: `Warning: ${selectedChild?.name || "Child"}'s drawings reflect a high density of ${dominantNegative} indicators (${Math.max(sad, angry, fear)}%). Psychological attention or parental intervention is highly recommended.`,
      };
    }

    return {
      isDanger: false,
      title: "Stable Emotional State",
      description: `${selectedChild?.name || "Child"} is presenting a highly balanced mental state. Analyzed data indicates safe emotional progression and normal creative expression.`,
    };
  }, [emotionBreakdown, childDrawings, selectedChild]);

  // WEEKLY SPARKLINE CHART MATH ENGINE
  const { emotionData, activityData, dayDetails, dailyDominantLabels } = useMemo(() => {
    const weeklyEmotionsCount = [0, 0, 0, 0, 0, 0, 0];
    const weeklyHappy = [0, 0, 0, 0, 0, 0, 0];
    const weeklySad = [0, 0, 0, 0, 0, 0, 0];
    const weeklyAngry = [0, 0, 0, 0, 0, 0, 0];
    const weeklyFear = [0, 0, 0, 0, 0, 0, 0];
    const weeklyMixed = [0, 0, 0, 0, 0, 0, 0];
    const weeklyActivityCount = [0, 0, 0, 0, 0, 0, 0];

    // 🚨 ADDED : any to bypass TypeScript rulebook
    childDrawings.forEach((d: any) => {
      // Handle Date formats perfectly from Neon
      const rawDate = d.date || d.upload_date || d.created_at || new Date().toISOString();
      const safeDateStr = typeof rawDate === 'string' ? rawDate.replace(" ", "T") : rawDate;
      const drawingDate = new Date(safeDateStr);
      
      let dayIndex = drawingDate.getDay() - 1; 
      if (dayIndex === -1) dayIndex = 6; 

      if (dayIndex >= 0 && dayIndex <= 6) {
        weeklyEmotionsCount[dayIndex] += 1;
        weeklyActivityCount[dayIndex] += 1;
        
        const status = (d?.analysis?.emotional_status || "").toLowerCase();
        if (status.includes("mix")) weeklyMixed[dayIndex]++;
        else {
          if (status.includes("happ") || status.includes("joy") || status.includes("positiv")) weeklyHappy[dayIndex]++;
          if (status.includes("sad")) weeklySad[dayIndex]++;
          if (status.includes("ang") || status.includes("frustrat")) weeklyAngry[dayIndex]++;
          if (status.includes("fear") || status.includes("anxi") || status.includes("scare") || status.includes("worr")) weeklyFear[dayIndex]++;
        }
      }
    });

    // 🚨 UPGRADED MOOD SCORE MATH
    const finalEmotion = weeklyEmotionsCount.map((total, idx) => {
      if (total === 0) return 50; // Neutral baseline (middle of the chart) for empty days

      // Give weights to emotions to create a dynamic line:
      const happyScore = weeklyHappy[idx] * 100; // Spikes the line UP
      const mixedScore = weeklyMixed[idx] * 60;  // Keeps the line slightly above neutral
      const negativeScore = (weeklySad[idx] + weeklyAngry[idx] + weeklyFear[idx]) * 20; // Dips the line DOWN
      
      const totalScore = happyScore + mixedScore + negativeScore;
      return Math.round(totalScore / total);
    });

    const finalActivity = weeklyActivityCount.map((count) => {
      if (count === 0) return 20;
      if (count === 1) return 50;
      if (count === 2) return 75;
      return 95;
    });

    const dominantLabels = weeklyEmotionsCount.map((total, idx) => {
      if (total === 0) return ""; 
      const max = Math.max(weeklyHappy[idx], weeklySad[idx], weeklyAngry[idx], weeklyFear[idx], weeklyMixed[idx]);
      if (max === weeklyHappy[idx]) return "Happy";
      if (max === weeklySad[idx]) return "Sad";
      if (max === weeklyAngry[idx]) return "Angry";
      if (max === weeklyFear[idx]) return "Fear";
      return "Mixed";
    });

    const daysName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const details = daysName.map((name, idx) => {
      const total = weeklyEmotionsCount[idx];
      if (total === 0) return `No drawings recorded on ${name}.`;
      
      // Filter out emotions with 0 count to keep the text clean
      let summary = [];
      if (weeklyHappy[idx] > 0) summary.push(`${weeklyHappy[idx]} Happy`);
      if (weeklySad[idx] > 0) summary.push(`${weeklySad[idx]} Sad`);
      if (weeklyAngry[idx] > 0) summary.push(`${weeklyAngry[idx]} Angry`);
      if (weeklyFear[idx] > 0) summary.push(`${weeklyFear[idx]} Fear`);
      if (weeklyMixed[idx] > 0) summary.push(`${weeklyMixed[idx]} Mixed`);
      
      return `${name}: ${summary.join(", ")}.`;
    });

    return { emotionData: finalEmotion, activityData: finalActivity, dayDetails: details, dailyDominantLabels: dominantLabels };
  }, [childDrawings]);

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
      setSelectedDayIndex(null); 
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
    Animated.timing(progressAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => { setProgressVisible(false); });
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
      if (progressVisible) { hideProgress(); } else { showProgress(); }
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: 110 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        
        {/* Welcome Card */}
        <Animated.View style={{ opacity: fadeGreet, transform: [{ translateY: fadeGreet.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <LinearGradient colors={["#C4A8F5", "#D4B0F0", "#F0B8D8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.welcomeCard}>
            <View style={styles.welcomeOrb1} /><View style={styles.welcomeOrb2} />
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeGreeting}>{getGreeting()}</Text>
              <Text style={styles.welcomeName}>{userName}</Text>
              <Text style={styles.welcomeSub}>Let's check in on your children today</Text>
              <View style={styles.welcomeChip}>
                <View style={styles.welcomeChipDot} />
                <Text style={styles.welcomeChipText}>{children.length} children · {drawings.length} drawings</Text>
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
              return <ChildCircle key={itemId} child={child} selected={selectedChildId === itemId} onTap={() => handleTap(itemId)} />;
            })}
            <TouchableOpacity onPress={() => router.push("/add-child")} style={styles.addCircleButton}>
              <View style={styles.addCircleDash}><Ionicons name="add" size={28} color="#C4A8F5" /></View>
              <Text style={styles.addCircleText}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

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

              {/* ... inside chartCard ... */}
              <View style={styles.chartBody}>
                
                
        
                <SparklineChart 
                  emotionData={emotionData} 
                  activityData={activityData} 
                  dailyDominantLabels={dailyDominantLabels}
                  width={320} 
                  selectedIndex={selectedDayIndex} 
                  onSelectIndex={setSelectedDayIndex} // 🚨 Added this!
                />

                <View style={styles.chartDayRow}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, index) => (
                    <TouchableOpacity 
                      key={d} 
                      style={[styles.dayTab, selectedDayIndex === index && styles.dayTabActive]} 
                      onPress={() => {
                        if (Platform.OS !== "web") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }
                        setSelectedDayIndex(selectedDayIndex === index ? null : index);
                      }}
                    >
                      <Text style={[styles.chartDay, selectedDayIndex === index && styles.chartDayActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {selectedDayIndex !== null && (
                <View style={styles.tooltipBanner}>
                  <Ionicons name="information-circle-outline" size={14} color="#7B5CE5" />
                  <Text style={styles.tooltipText}>{dayDetails[selectedDayIndex]}</Text>
                </View>
              )}

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

        {/* Weekly Mood Analytics */}
        {selectedChild && progressVisible && (
          <Animated.View style={{ opacity: Animated.multiply(Animated.multiply(fadeInsight, chartFade), progressAnim), marginBottom: 16 }}>
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Weekly Mood Analytics</Text>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownEmoji}>😊</Text>
                  <Text style={styles.breakdownLabel}>Happy</Text>
                  <Text style={[styles.breakdownPct, { color: "#16A34A" }]}>{emotionBreakdown.happy}%</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownEmoji}>😢</Text>
                  <Text style={styles.breakdownLabel}>Sad</Text>
                  <Text style={[styles.breakdownPct, { color: "#3B82F6" }]}>{emotionBreakdown.sad}%</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownEmoji}>😡</Text>
                  <Text style={styles.breakdownLabel}>Angry</Text>
                  <Text style={[styles.breakdownPct, { color: "#EF4444" }]}>{emotionBreakdown.angry}%</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownEmoji}>😨</Text>
                  <Text style={styles.breakdownLabel}>Fear</Text>
                  <Text style={[styles.breakdownPct, { color: "#8B5CF6" }]}>{emotionBreakdown.fear}%</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownEmoji}>🌪️</Text>
                  <Text style={styles.breakdownLabel}>Mixed</Text>
                  <Text style={[styles.breakdownPct, { color: "#F59E0B" }]}>{emotionBreakdown.mixed}%</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Status Box */}
        {selectedChild && progressVisible && (
          <Animated.View style={{ opacity: Animated.multiply(Animated.multiply(fadeInsight, chartFade), progressAnim), marginBottom: 16 }}>
            <View style={[
              styles.statusContainerBox, 
              childStatusEvaluation.isDanger ? styles.statusBoxDanger : styles.statusBoxSafe
            ]}>
              <View style={styles.statusBoxHeader}>
                <Ionicons 
                  name={childStatusEvaluation.isDanger ? "alert-circle" : "checkmark-circle"} 
                  size={18} 
                  color={childStatusEvaluation.isDanger ? "#E63946" : "#16A34A"} 
                />
                <Text style={[
                  styles.statusBoxTitle, 
                  childStatusEvaluation.isDanger ? styles.textDanger : styles.textSafe
                ]}>
                  {childStatusEvaluation.title}
                </Text>
              </View>
              <Text style={[
                styles.statusBoxDescription,
                childStatusEvaluation.isDanger ? styles.textDangerSub : styles.textSafeSub
              ]}>
                {childStatusEvaluation.description}
              </Text>
            </View>
          </Animated.View>
        )}

        
        {/* Recent Drawings */}
        <Animated.View style={{ opacity: fadeActions, transform: [{ translateY: fadeActions.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Add New Drawing</Text>
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
  chartLegend: { flexDirection: "row", gap: 18, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_500Medium" },
  chartBody: { alignItems: "center" },
  chartDayRow: { flexDirection: "row", justifyContent: "space-between", width: 320, marginTop: 6, paddingHorizontal: 4 },
  dayTab: { flex: 1, paddingVertical: 4, alignItems: "center", borderRadius: 8 },
  dayTabActive: { backgroundColor: "rgba(167,139,250,0.15)" },
  chartDay: { fontSize: 10, color: "#C0B0D8", fontFamily: "Inter_500Medium", textAlign: "center" },
  chartDayActive: { color: "#7B5CE5", fontWeight: "700" },
  tooltipBanner: { 
    position: 'absolute', 
    top: 40,              
    alignSelf: 'center',  // 🚨 This is the magic line that stops it from stretching!
    zIndex: 999,          
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    gap: 6, 
    backgroundColor: "#F3EEFF", 
    paddingVertical: 10,  // 🚨 Adjusted padding for a cleaner pill shape
    paddingHorizontal: 16,
    borderRadius: 24, 
    borderWidth: 1,
    borderColor: "#D4C8FF",
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    maxWidth: '90%',      // 🚨 Ensures it doesn't fall off the screen if the text is long
  },
  tooltipText: { 
    fontSize: 12, 
    color: "#5F45B2", 
    fontFamily: "Inter_500Medium",
    textAlign: "center" 
  },
  chartStats: { flexDirection: "row", marginTop: 14, borderTopWidth: 1, borderTopColor: "#F0ECFF", paddingTop: 14 },
  chartStatChip: { flex: 1, alignItems: "center" },
  chartStatChipMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#F0ECFF" },
  chartStatNum: { fontSize: 20, fontWeight: "800", color: "#A78BFA", fontFamily: "Inter_700Bold" },
  chartStatLabel: { fontSize: 11, color: "#B0A0CC", fontFamily: "Inter_400Regular", marginTop: 2 },
  
  breakdownCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 4, borderWidth: 1, borderColor: "#F0EEFF" },
  breakdownTitle: { fontSize: 14, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold", marginBottom: 12 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between" },
  breakdownItem: { alignItems: "center", flex: 1 },
  breakdownEmoji: { fontSize: 20, marginBottom: 4 },
  breakdownLabel: { fontSize: 11, color: "#A090B8", fontFamily: "Inter_400Regular" },
  breakdownPct: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 2 },

  statusContainerBox: { padding: 18, borderRadius: 24, borderWidth: 1.5, elevation: 2 },
  statusBoxSafe: { backgroundColor: "#F4FDF9", borderColor: "rgba(144,190,109,0.25)" },
  statusBoxDanger: { backgroundColor: "#FFF2F2", borderColor: "rgba(230,57,70,0.25)" },
  statusBoxHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  statusBoxTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  textSafe: { color: "#477A23" },
  textDanger: { color: "#B81422" },
  statusBoxDescription: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  textSafeSub: { color: "#608066" },
  textDangerSub: { color: "#B05861", fontWeight: "600" },

  insightCard: { borderRadius: 24, overflow: "hidden", marginBottom: 28, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  insightGradient: { borderRadius: 24, padding: 18, borderWidth: 1.5, borderColor: "rgba(196,168,245,0.25)" },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  insightIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#F0E8FF", alignItems: "center", justifyContent: "center" },
  insightHeading: { fontSize: 14, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  insightText: { fontSize: 13, color: "#7A6090", fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 12 },
  insightLinkText: { fontSize: 12, fontWeight: "700", color: "#A78BFA", fontFamily: "Inter_700Bold" },
  actionsCol: { gap: 12 },
  actionBtnWrap: { borderRadius: 22, overflow: "hidden" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18, paddingHorizontal: 20, borderRadius: 22, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 18, elevation: 10 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  actionTextWrap: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  actionSub: { fontSize: 11, color: "rgba(255,255,255,0.68)", fontFamily: "Inter_400Regular", marginTop: 2 },
});
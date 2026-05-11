import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useApp } from "@/context/AppContext";
import type { Child, Drawing } from "@/context/AppContext";

// ── Emotion config ─────────────────────────────────────────────────────────────
const EMOTION_CONFIG: Record<string, { color: string; icon: string }> = {
  Happy:   { color: "#90BE6D", icon: "happy-outline" },
  Sad:     { color: "#577590", icon: "sad-outline" },
  Angry:   { color: "#F3722C", icon: "flame-outline" },
  Anxiety: { color: "#F8961E", icon: "alert-circle-outline" },
  Fear:    { color: "#9B7FFF", icon: "eye-off-outline" },
};

function emotionConfig(emotion: string) {
  return EMOTION_CONFIG[emotion] ?? { color: "#6C4DFF", icon: "ellipse-outline" };
}

// ── Circular child selector ────────────────────────────────────────────────────
function ChildSelector({
  child,
  selected,
  onPress,
}: {
  child: Child;
  selected: boolean;
  onPress: () => void;
}) {
  const ring = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(ring, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      speed: 26,
      bounciness: 7,
    }).start();
  }, [selected]);

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 2 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40, bounciness: 8 }),
    ]).start();
    onPress();
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.selectorWrap}>
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.selectorRing,
          {
            borderColor: child.avatarColor,
            opacity: ring,
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
            shadowColor: child.avatarColor,
          },
        ]}
      />
      {/* Circle */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={[child.avatarColor + "DD", child.avatarColor]}
          style={styles.selectorCircle}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        >
          <View style={styles.selectorShine} />
          <Text style={styles.selectorInitials}>{child.initials}</Text>
        </LinearGradient>
      </Animated.View>
      <Text
        style={[styles.selectorName, selected && { color: "#6C4DFF", fontFamily: "Inter_700Bold" }]}
        numberOfLines={1}
      >
        {child.name}
      </Text>
      {selected && <View style={[styles.selectorDot, { backgroundColor: child.avatarColor }]} />}
    </TouchableOpacity>
  );
}

// ── Emotion bar ────────────────────────────────────────────────────────────────
function EmotionBar({ name, percentage, color }: { name: string; percentage: number; color: string }) {
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: percentage / 100,
      duration: 600,
      delay: 100,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={styles.emotionBarRow}>
      <Text style={styles.emotionBarLabel}>{name}</Text>
      <View style={styles.emotionBarTrack}>
        <Animated.View
          style={[
            styles.emotionBarFill,
            {
              backgroundColor: color,
              width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
      </View>
      <Text style={[styles.emotionBarPct, { color }]}>{percentage}%</Text>
    </View>
  );
}

// ── Drawing card ──────────────────────────────────────────────────────────────
function DrawingCard({
  drawing,
  child,
  index,
}: {
  drawing: Drawing;
  child: Child;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;
  const cfg = emotionConfig(drawing.mainEmotion);

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  function toggleExpand() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = expanded ? 0 : 1;
    Animated.spring(expandAnim, {
      toValue: target,
      useNativeDriver: false,
      speed: 20,
      bounciness: 4,
    }).start();
    setExpanded(!expanded);
  }

  const confColor =
    drawing.confidence >= 80 ? "#90BE6D" :
    drawing.confidence >= 55 ? "#F8961E" : "#F3722C";

  return (
    <Animated.View
      style={[
        styles.drawingCard,
        {
          opacity: mountAnim,
          transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      {/* Top row: thumbnail + core info */}
      <View style={styles.drawingCardTop}>
        {/* Thumbnail */}
        <LinearGradient
          colors={[child.avatarColor + "33", child.avatarColor + "18"]}
          style={styles.drawingThumb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.drawingThumbIcon, { backgroundColor: child.avatarColor + "22" }]}>
            <Ionicons name="brush" size={26} color={child.avatarColor} />
          </View>
          {/* Date badge */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>
              {new Date(drawing.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </Text>
          </View>
        </LinearGradient>

        {/* Info column */}
        <View style={styles.drawingInfo}>
          <Text style={styles.drawingTitle}>Drawing #{String(index + 1).padStart(2, "0")}</Text>

          {/* Emotion badge */}
          <View style={[styles.emotionBadge, { backgroundColor: cfg.color + "1A" }]}>
            <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
            <Text style={[styles.emotionBadgeText, { color: cfg.color }]}>
              {drawing.mainEmotion}
            </Text>
          </View>

          {/* Confidence ring row */}
          <View style={styles.confRow}>
            <View style={[styles.confPill, { borderColor: confColor + "44", backgroundColor: confColor + "12" }]}>
              <Text style={[styles.confPct, { color: confColor }]}>{drawing.confidence}%</Text>
              <Text style={styles.confLabel}>confidence</Text>
            </View>
            <View style={styles.confPill2}>
              <Ionicons name="color-palette-outline" size={11} color="#8B7BAB" />
              <Text style={styles.confLabel2}>Creativity {drawing.creativityLevel}%</Text>
            </View>
          </View>

          {/* Summary snippet */}
          <Text style={styles.summarySnippet} numberOfLines={2}>
            {drawing.summary}
          </Text>
        </View>
      </View>

      {/* Expanded analysis */}
      <Animated.View
        style={{
          maxHeight: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 420] }),
          opacity: expandAnim,
          overflow: "hidden",
        }}
      >
        <View style={styles.expandedBody}>
          {/* Divider */}
          <View style={styles.divider} />

          {/* Emotion bars */}
          <Text style={styles.expandedSectionLabel}>Emotion Breakdown</Text>
          {drawing.emotions.map((em) => (
            <EmotionBar key={em.name} name={em.name} percentage={em.percentage} color={em.color} />
          ))}

          {/* Emotional state + indicators */}
          <View style={styles.stateRow}>
            <View style={[styles.stateChip, { backgroundColor: "#EDE9FF" }]}>
              <Ionicons name="heart-outline" size={13} color="#6C4DFF" />
              <Text style={styles.stateChipText}>{drawing.emotionalState}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoGridItem}>
              <Text style={styles.infoGridLabel}>Social</Text>
              <Text style={styles.infoGridValue}>{drawing.socialIndicators}</Text>
            </View>
            <View style={styles.infoGridItem}>
              <Text style={styles.infoGridLabel}>Stress signals</Text>
              <Text style={styles.infoGridValue}>{drawing.stressSignals}</Text>
            </View>
          </View>

          {/* Recommendations */}
          <Text style={styles.expandedSectionLabel}>Recommendations</Text>
          {drawing.recommendations.map((rec, i) => (
            <View key={i} style={styles.recRow}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}

          {/* Full analysis link */}
          <TouchableOpacity
            style={styles.fullAnalysisBtn}
            onPress={() => router.push({ pathname: "/drawing-detail", params: { drawingId: drawing.id } })}
          >
            <LinearGradient
              colors={["#6C4DFF", "#9B7FFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fullAnalysisBtnInner}
            >
              <Text style={styles.fullAnalysisBtnText}>View Full Analysis</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Expand toggle */}
      <Pressable onPress={toggleExpand} style={styles.expandToggle}>
        <Text style={styles.expandToggleText}>
          {expanded ? "Hide analysis" : "Show analysis"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color="#6C4DFF"
        />
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function DrawingsScreen() {
  const insets = useSafeAreaInsets();
  const { children, drawings, getChildEmotionSummary } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [selectedId, setSelectedId] = useState<string>(children[0]?.id ?? "");

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedId),
    [selectedId, children]
  );

  const childDrawings = useMemo(
    () => drawings.filter((d) => d.childId === selectedId),
    [drawings, selectedId]
  );

  // Fade when child changes
  const listFade = useRef(new Animated.Value(1)).current;
  const prevId = useRef(selectedId);
  function selectChild(id: string) {
    if (id === selectedId) return;
    Animated.timing(listFade, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setSelectedId(id);
      prevId.current = id;
      Animated.timing(listFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
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
        {/* ── Header ── */}
        <Text style={styles.pageTitle}>Children's Drawings</Text>

        {/* ── Child Selectors ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorsRow}
        >
          {children.map((child) => (
            <ChildSelector
              key={child.id}
              child={child}
              selected={selectedId === child.id}
              onPress={() => selectChild(child.id)}
            />
          ))}

          <TouchableOpacity
            style={styles.selectorWrap}
            onPress={() => router.push("/add-child")}
            activeOpacity={0.8}
          >
            <View style={styles.addCircle}>
              <Ionicons name="add" size={24} color="#6C4DFF" />
            </View>
            <Text style={styles.selectorName}>Add</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Selected child info bar ── */}
        {selectedChild && (
          <LinearGradient
            colors={[selectedChild.avatarColor + "22", selectedChild.avatarColor + "08"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.childInfoBar}
          >
            <View style={styles.childInfoLeft}>
              <LinearGradient
                colors={[selectedChild.avatarColor + "CC", selectedChild.avatarColor]}
                style={styles.childInfoAvatar}
              >
                <Text style={styles.childInfoInitials}>{selectedChild.initials}</Text>
              </LinearGradient>
              <View>
                <Text style={styles.childInfoName}>{selectedChild.name}</Text>
                <Text style={styles.childInfoMeta}>
                  Age {selectedChild.age} · {childDrawings.length} drawing{childDrawings.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <View style={[styles.emotionSummaryBadge, { borderColor: selectedChild.avatarColor + "44" }]}>
              <Text style={[styles.emotionSummaryText, { color: selectedChild.avatarColor }]}>
                {getChildEmotionSummary(selectedChild.id)}
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* ── Drawings list ── */}
        <Animated.View style={{ opacity: listFade }}>
          {childDrawings.length > 0 ? (
            childDrawings.map((drawing, i) => (
              <DrawingCard
                key={drawing.id}
                drawing={drawing}
                child={selectedChild!}
                index={i}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={["#EDE9FF", "#F5F1FF"]}
                style={styles.emptyStateIcon}
              >
                <Ionicons name="brush-outline" size={36} color="#B89CFF" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No drawings yet</Text>
              <Text style={styles.emptySubtitle}>
                Start a drawing session with {selectedChild?.name} to see their emotional analysis here.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/choose-child")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#6C4DFF", "#9B7FFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyBtn}
                >
                  <Ionicons name="brush" size={16} color="#fff" />
                  <Text style={styles.emptyBtnText}>Start Drawing</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F1FF" },
  scroll: { paddingHorizontal: 20 },

  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 20,
  },

  /* ── Child selectors ── */
  selectorsRow: {
    gap: 16,
    paddingBottom: 6,
    paddingHorizontal: 2,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  selectorWrap: { alignItems: "center", width: 68 },
  selectorRing: {
    position: "absolute",
    top: -5,
    left: -5,
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 0,
  },
  selectorCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  selectorShine: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.22)",
    top: -7,
    left: -7,
  },
  selectorInitials: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  selectorName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4A3880",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginTop: 8,
  },
  selectorDot: { width: 6, height: 6, borderRadius: 3, marginTop: 3 },
  addCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D4C8FF",
    borderStyle: "dashed",
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  /* ── Child info bar ── */
  childInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 22,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(108,77,255,0.1)",
  },
  childInfoLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  childInfoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  childInfoInitials: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  childInfoName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  childInfoMeta: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  emotionSummaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
  },
  emotionSummaryText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  /* ── Drawing card ── */
  drawingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 6,
  },
  drawingCardTop: { flexDirection: "row", gap: 14 },
  drawingThumb: {
    width: 100,
    height: 110,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  drawingThumbIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dateBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 10,
    paddingVertical: 3,
    alignItems: "center",
  },
  dateBadgeText: {
    fontSize: 10,
    color: "#5A4A7A",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  drawingInfo: { flex: 1, gap: 7 },
  drawingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  emotionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emotionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  confRow: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  confPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  confPct: { fontSize: 13, fontWeight: "800", fontFamily: "Inter_700Bold" },
  confLabel: { fontSize: 10, color: "#8B7BAB", fontFamily: "Inter_400Regular" },
  confPill2: { flexDirection: "row", alignItems: "center", gap: 4 },
  confLabel2: { fontSize: 10, color: "#8B7BAB", fontFamily: "Inter_400Regular" },
  summarySnippet: {
    fontSize: 11,
    color: "#7A6A9A",
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },

  /* ── Expanded body ── */
  expandedBody: { paddingTop: 4 },
  divider: {
    height: 1,
    backgroundColor: "#F0ECFF",
    marginVertical: 14,
  },
  expandedSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B7BAB",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  emotionBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  emotionBarLabel: {
    width: 72,
    fontSize: 12,
    color: "#5A4A7A",
    fontFamily: "Inter_500Medium",
  },
  emotionBarTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F0ECFF",
    overflow: "hidden",
  },
  emotionBarFill: { height: "100%", borderRadius: 4 },
  emotionBarPct: {
    width: 36,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  stateRow: { marginTop: 12, marginBottom: 10 },
  stateChip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderRadius: 12,
    padding: 10,
  },
  stateChipText: {
    flex: 1,
    fontSize: 12,
    color: "#4A3880",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  infoGrid: { gap: 10, marginBottom: 14 },
  infoGridItem: { gap: 3 },
  infoGridLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B7BAB",
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoGridValue: {
    fontSize: 12,
    color: "#5A4A7A",
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  recRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 7,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6C4DFF",
    marginTop: 5,
  },
  recText: {
    flex: 1,
    fontSize: 12,
    color: "#5A4A7A",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  fullAnalysisBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
  },
  fullAnalysisBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  fullAnalysisBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },

  /* ── Expand toggle ── */
  expandToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0ECFF",
    marginTop: 14,
  },
  expandToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6C4DFF",
    fontFamily: "Inter_700Bold",
  },

  /* ── Empty state ── */
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 14,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
});

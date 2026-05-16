import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { Child, Drawing } from "@/context/AppContext";

// ── Emotion config ─────────────────────────────────────────────────────────────
const EMOTION_CONFIG: Record<string, { color: string; icon: string }> = {
  Happy:   { color: "#90BE6D", icon: "happy-outline" },
  Sad:     { color: "#577590", icon: "sad-outline" },
  Angry:   { color: "#F3722C", icon: "flame-outline" },
  Anxiety: { color: "#F8961E", icon: "alert-circle-outline" },
  Fear:    { color: "#C4B0FF", icon: "eye-off-outline" },
};
function ecfg(emotion: string) {
  return EMOTION_CONFIG[emotion] ?? { color: "#A78BFA", icon: "ellipse-outline" };
}

// ── Animated emotion bar ───────────────────────────────────────────────────────
function EmotionBar({ name, percentage, color, delay = 0 }: { name: string; percentage: number; color: string; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: percentage / 100, duration: 600, delay, useNativeDriver: false }).start();
  }, [percentage]);
  return (
    <View style={eb.row}>
      <Text style={eb.label}>{name}</Text>
      <View style={eb.track}>
        <Animated.View style={[eb.fill, { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
      </View>
      <Text style={[eb.pct, { color }]}>{percentage}%</Text>
    </View>
  );
}
const eb = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  label: { width: 68, fontSize: 12, color: "#5A4A7A", fontFamily: "Inter_500Medium" },
  track: { flex: 1, height: 7, borderRadius: 4, backgroundColor: "#F0ECFF", overflow: "hidden" },
  fill:  { height: "100%", borderRadius: 4 },
  pct:   { width: 36, fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "right" },
});

// ── Drawing card ──────────────────────────────────────────────────────────────
function DrawingCard({ drawing, child, index }: { drawing: Drawing; child: Child; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const mountAnim  = useRef(new Animated.Value(0)).current;
  const cfg = ecfg(drawing.mainEmotion);

  // Extract canvas snapshot or uploaded image from pathsJson
  let thumbUri: string | null = null;
  if (drawing.pathsJson) {
    try {
      const parsed = JSON.parse(drawing.pathsJson);
      if (parsed?.imageUri) thumbUri = parsed.imageUri;
    } catch { /* ignore */ }
  }

  useEffect(() => {
    Animated.timing(mountAnim, { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }).start();
  }, []);

  function toggleExpand() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(expandAnim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start();
    setExpanded(!expanded);
  }

  const confColor = drawing.confidence >= 80 ? "#90BE6D" : drawing.confidence >= 55 ? "#F8961E" : "#F3722C";

  return (
    <Animated.View style={[dc.card, { opacity: mountAnim, transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      {/* Top row */}
      <View style={dc.top}>
        {thumbUri ? (
          <View style={dc.thumb}>
            <Image source={{ uri: thumbUri }} style={dc.thumbImg} resizeMode="cover" />
            <View style={dc.dateBadge}>
              <Text style={dc.dateBadgeText}>{new Date(drawing.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</Text>
            </View>
          </View>
        ) : (
          <LinearGradient colors={[child.avatarColor + "33", child.avatarColor + "18"]} style={dc.thumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={[dc.thumbIcon, { backgroundColor: child.avatarColor + "22" }]}>
              <Ionicons name="brush" size={26} color={child.avatarColor} />
            </View>
            <View style={dc.dateBadge}>
              <Text style={dc.dateBadgeText}>{new Date(drawing.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</Text>
            </View>
          </LinearGradient>
        )}

        <View style={dc.info}>
          <Text style={dc.title}>Drawing #{String(index + 1).padStart(2, "0")}</Text>

          <View style={[dc.emotionBadge, { backgroundColor: cfg.color + "1A" }]}>
            <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
            <Text style={[dc.emotionText, { color: cfg.color }]}>{drawing.mainEmotion}</Text>
          </View>

          <View style={dc.pillRow}>
            <View style={[dc.pill, { borderColor: confColor + "44", backgroundColor: confColor + "12" }]}>
              <Text style={[dc.pillPct, { color: confColor }]}>{drawing.confidence}%</Text>
              <Text style={dc.pillLabel}>confidence</Text>
            </View>
            <View style={dc.pill2}>
              <Ionicons name="color-palette-outline" size={11} color="#A090B8" />
              <Text style={dc.pillLabel2}>Creativity {drawing.creativityLevel}%</Text>
            </View>
          </View>

          <Text style={dc.summary} numberOfLines={2}>{drawing.summary}</Text>
        </View>
      </View>

      {/* Expanded */}
      <Animated.View style={{ maxHeight: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 440] }), opacity: expandAnim, overflow: "hidden" }}>
        <View style={dc.expanded}>
          <View style={dc.divider} />

          <Text style={dc.sectionLabel}>Emotion Breakdown</Text>
          {drawing.emotions.map((em) => (
            <EmotionBar key={em.name} name={em.name} percentage={em.percentage} color={em.color} />
          ))}

          <View style={[dc.stateChip, { backgroundColor: "#F0E8FF", marginTop: 10 }]}>
            <Ionicons name="heart-outline" size={13} color="#A78BFA" />
            <Text style={dc.stateChipText}>{drawing.emotionalState}</Text>
          </View>

          <View style={dc.infoGrid}>
            <View style={dc.infoItem}>
              <Text style={dc.infoLabel}>Social indicators</Text>
              <Text style={dc.infoValue}>{drawing.socialIndicators}</Text>
            </View>
            <View style={dc.infoItem}>
              <Text style={dc.infoLabel}>Stress signals</Text>
              <Text style={dc.infoValue}>{drawing.stressSignals}</Text>
            </View>
          </View>

          <Text style={dc.sectionLabel}>Recommendations</Text>
          {drawing.recommendations.map((r, i) => (
            <View key={i} style={dc.recRow}>
              <View style={dc.recDot} />
              <Text style={dc.recText}>{r}</Text>
            </View>
          ))}

          <TouchableOpacity style={dc.fullBtn} onPress={() => router.push({ pathname: "/drawing-detail", params: { drawingId: drawing.id } })}>
            <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dc.fullBtnInner}>
              <Text style={dc.fullBtnText}>View Full Analysis</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Toggle */}
      <Pressable onPress={toggleExpand} style={dc.toggle}>
        <Text style={dc.toggleText}>{expanded ? "Hide analysis" : "Show analysis"}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color="#A78BFA" />
      </Pressable>
    </Animated.View>
  );
}

const dc = StyleSheet.create({
  card:     { backgroundColor: "#FFF5F8", borderRadius: 24, padding: 16, marginBottom: 14, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 18, elevation: 6 },
  top:      { flexDirection: "row", gap: 14 },
  thumb:    { width: 100, height: 108, borderRadius: 18, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  thumbImg:  { width: 100, height: 108, borderRadius: 18 },
  thumbIcon: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dateBadge: { position: "absolute", bottom: 8, left: 8, right: 8, backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 10, paddingVertical: 3, alignItems: "center" },
  dateBadgeText: { fontSize: 10, color: "#5A4A7A", fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  info:      { flex: 1, gap: 7 },
  title:     { fontSize: 15, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  emotionBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  emotionText:  { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  pillRow:   { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  pill:      { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  pillPct:   { fontSize: 13, fontWeight: "800", fontFamily: "Inter_700Bold" },
  pillLabel: { fontSize: 10, color: "#A090B8", fontFamily: "Inter_400Regular" },
  pill2:     { flexDirection: "row", alignItems: "center", gap: 4 },
  pillLabel2: { fontSize: 10, color: "#A090B8", fontFamily: "Inter_400Regular" },
  summary:   { fontSize: 11, color: "#7A6A9A", fontFamily: "Inter_400Regular", lineHeight: 16 },
  expanded:  { paddingTop: 4 },
  divider:   { height: 1, backgroundColor: "#F0ECFF", marginVertical: 14 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#A090B8", fontFamily: "Inter_700Bold", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 },
  stateChip: { flexDirection: "row", alignItems: "flex-start", gap: 7, borderRadius: 12, padding: 10, marginBottom: 12 },
  stateChipText: { flex: 1, fontSize: 12, color: "#4A3880", fontFamily: "Inter_400Regular", lineHeight: 18 },
  infoGrid:  { gap: 10, marginBottom: 14 },
  infoItem:  { gap: 3 },
  infoLabel: { fontSize: 10, fontWeight: "700", color: "#A090B8", fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 12, color: "#5A4A7A", fontFamily: "Inter_400Regular", lineHeight: 17 },
  recRow:    { flexDirection: "row", alignItems: "flex-start", gap: 9, marginBottom: 7 },
  recDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: "#A78BFA", marginTop: 5 },
  recText:   { flex: 1, fontSize: 12, color: "#5A4A7A", fontFamily: "Inter_400Regular", lineHeight: 18 },
  fullBtn:   { borderRadius: 16, overflow: "hidden", marginTop: 12 },
  fullBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  fullBtnText:  { fontSize: 13, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  toggle:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F0ECFF", marginTop: 14 },
  toggleText: { fontSize: 12, fontWeight: "700", color: "#A78BFA", fontFamily: "Inter_700Bold" },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function ChildProfileScreen() {
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;
  const botPad  = Platform.OS === "web" ? 34 : insets.bottom;
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { children, drawings, getChildEmotionSummary } = useApp();

  const child = children.find((c) => c.id === childId);
  const childDrawings = drawings.filter((d) => d.childId === childId);

  if (!child) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#4A3070" />
        </TouchableOpacity>
        <Text style={styles.notFound}>Child not found</Text>
      </View>
    );
  }

  // Emotion summary data
  const emotionCounts: Record<string, number> = {};
  childDrawings.forEach((d) => {
    emotionCounts[d.mainEmotion] = (emotionCounts[d.mainEmotion] ?? 0) + 1;
  });
  const total = childDrawings.length;
  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const happyPct = total > 0 ? Math.round(((emotionCounts["Happy"] ?? 0) / total) * 100) : 0;
  const stabilityLabel = happyPct >= 70 ? "High" : happyPct >= 40 ? "Moderate" : "Needs attention";
  const stabilityColor = happyPct >= 70 ? "#90BE6D" : happyPct >= 40 ? "#F8961E" : "#F3722C";

  const emotionBars = Object.entries(emotionCounts).map(([name, count]) => ({
    name,
    pct: Math.round((count / Math.max(total, 1)) * 100),
    color: EMOTION_CONFIG[name]?.color ?? "#A78BFA",
  })).sort((a, b) => b.pct - a.pct);

  const aiInsight = total === 0
    ? "No drawings yet. Start drawing sessions to build an emotional profile."
    : `${child.name} demonstrates ${dominantEmotion.toLowerCase()} as their primary emotional state across ${total} drawing${total !== 1 ? "s" : ""}. Emotional stability is ${stabilityLabel.toLowerCase()}.`;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nav ── */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#4A3070" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Child Profile</Text>
          <TouchableOpacity
            style={styles.editNavBtn}
            onPress={() => router.push({ pathname: "/edit-child", params: { childId: child.id } })}
          >
            <Ionicons name="pencil" size={16} color="#A78BFA" />
          </TouchableOpacity>
        </View>

        {/* ── Hero card ── */}
        <LinearGradient
          colors={[child.avatarColor + "22", child.avatarColor + "08"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Big circle avatar */}
          <LinearGradient
            colors={[child.avatarColor + "DD", child.avatarColor]}
            style={styles.heroAvatar}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
          >
            <View style={styles.heroAvatarShine} />
            <Text style={styles.heroInitials}>{child.initials}</Text>
          </LinearGradient>

          <Text style={styles.heroName}>{child.name}</Text>
          <Text style={styles.heroMeta}>Age {child.age} · {child.gender}</Text>

          {child.favoriteActivities ? (
            <View style={styles.activitiesChip}>
              <Ionicons name="star-outline" size={12} color="#A78BFA" />
              <Text style={styles.activitiesText}>{child.favoriteActivities}</Text>
            </View>
          ) : null}

          {/* Stats row */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatNum, { color: child.avatarColor }]}>{total}</Text>
              <Text style={styles.heroStatLabel}>Drawings</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatNum, { color: child.avatarColor }]}>{happyPct}%</Text>
              <Text style={styles.heroStatLabel}>Happy</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatNum, { color: stabilityColor }]}>{stabilityLabel}</Text>
              <Text style={styles.heroStatLabel}>Stability</Text>
            </View>
          </View>

          {/* Edit profile button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push({ pathname: "/edit-child", params: { childId: child.id } })}
            activeOpacity={0.85}
          >
            <Ionicons name="pencil-outline" size={15} color="#A78BFA" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Overall AI Summary ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Summary</Text>
        </View>

        <View style={styles.aiCard}>
          <LinearGradient
            colors={["#F0E8FF", "#FDF8F5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCardInner}
          >
            {/* Summary chips */}
            <View style={styles.aiChipRow}>
              <View style={[styles.aiChip, { backgroundColor: (EMOTION_CONFIG[dominantEmotion]?.color ?? "#A78BFA") + "20" }]}>
                <Text style={[styles.aiChipLabel, { color: EMOTION_CONFIG[dominantEmotion]?.color ?? "#A78BFA" }]}>
                  Mostly {dominantEmotion}
                </Text>
              </View>
              <View style={[styles.aiChip, { backgroundColor: stabilityColor + "18" }]}>
                <Text style={[styles.aiChipLabel, { color: stabilityColor }]}>
                  Stability: {stabilityLabel}
                </Text>
              </View>
            </View>

            {/* Insight text */}
            <View style={styles.aiInsightRow}>
              <View style={styles.aiInsightIcon}>
                <Ionicons name="sparkles" size={15} color="#A78BFA" />
              </View>
              <Text style={styles.aiInsightText}>{aiInsight}</Text>
            </View>

            {/* Emotion bars */}
            {emotionBars.length > 0 && (
              <View style={styles.aiBars}>
                <Text style={styles.aiBarsLabel}>Emotional Distribution</Text>
                {emotionBars.map((eb, i) => (
                  <EmotionBar key={eb.name} name={eb.name} percentage={eb.pct} color={eb.color} delay={i * 120} />
                ))}
              </View>
            )}

            {/* Notes if present */}
            {(child.emotionalNotes || child.parentNotes) && (
              <View style={styles.aiNotes}>
                {child.emotionalNotes ? (
                  <View style={styles.aiNoteItem}>
                    <Text style={styles.aiNoteLabel}>Emotional notes</Text>
                    <Text style={styles.aiNoteValue}>{child.emotionalNotes}</Text>
                  </View>
                ) : null}
                {child.parentNotes ? (
                  <View style={styles.aiNoteItem}>
                    <Text style={styles.aiNoteLabel}>Parent notes</Text>
                    <Text style={styles.aiNoteValue}>{child.parentNotes}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </LinearGradient>
        </View>

        {/* ── Drawings ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{child.name}'s Drawings</Text>
          <Text style={styles.sectionCount}>{total} total</Text>
        </View>

        {childDrawings.length > 0 ? (
          childDrawings.map((drawing, i) => (
            <DrawingCard key={drawing.id} drawing={drawing} child={child} index={i} />
          ))
        ) : (
          <View style={styles.emptyDrawings}>
            <LinearGradient colors={["#F0E8FF", "#FDF8F5"]} style={styles.emptyDrawingsIcon}>
              <Ionicons name="brush-outline" size={34} color="#B89CFF" />
            </LinearGradient>
            <Text style={styles.emptyDrawingsTitle}>No drawings yet</Text>
            <Text style={styles.emptyDrawingsSub}>
              Start a drawing session with {child.name} to begin emotional analysis.
            </Text>
            <TouchableOpacity onPress={() => router.push("/choose-child")} activeOpacity={0.85}>
              <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyDrawingsBtn}>
                <Ionicons name="brush" size={16} color="#fff" />
                <Text style={styles.emptyDrawingsBtnText}>Start Drawing</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  scroll: { paddingHorizontal: 20 },
  notFound: { fontSize: 16, color: "#A090B8", textAlign: "center", marginTop: 40, fontFamily: "Inter_400Regular" },

  /* ── Nav ── */
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF5F8", alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  editNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F0E8FF", alignItems: "center", justifyContent: "center" },

  /* ── Hero ── */
  heroCard: { borderRadius: 32, padding: 24, alignItems: "center", marginBottom: 24, borderWidth: 1, borderColor: "rgba(108,77,255,0.1)" },
  heroAvatar: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 },
  heroAvatarShine: { position: "absolute", width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.24)", top: -10, left: -10 },
  heroInitials: { fontSize: 32, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  heroName: { fontSize: 26, fontWeight: "800", color: "#4A3070", fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 4 },
  heroMeta: { fontSize: 14, color: "#A090B8", fontFamily: "Inter_400Regular", marginBottom: 10 },
  activitiesChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF5F8", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 18 },
  activitiesText: { fontSize: 12, color: "#A78BFA", fontFamily: "Inter_500Medium" },
  heroStats: { flexDirection: "row", width: "100%", borderRadius: 20, backgroundColor: "#FFF5F8", paddingVertical: 14, marginBottom: 16 },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatNum: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  heroStatLabel: { fontSize: 11, color: "#A090B8", fontFamily: "Inter_400Regular", marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: "#F0ECFF" },
  editProfileBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#FFF5F8", borderWidth: 1.5, borderColor: "#EAD4F5" },
  editProfileText: { fontSize: 13, fontWeight: "700", color: "#A78BFA", fontFamily: "Inter_700Bold" },

  /* ── Section header ── */
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  sectionCount: { fontSize: 13, color: "#A090B8", fontFamily: "Inter_500Medium" },

  /* ── AI Card ── */
  aiCard: { borderRadius: 24, overflow: "hidden", marginBottom: 24, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  aiCardInner: { borderRadius: 24, padding: 18, borderWidth: 1.5, borderColor: "rgba(108,77,255,0.12)" },
  aiChipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  aiChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  aiChipLabel: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  aiInsightRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 14 },
  aiInsightIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#E4DDFF", alignItems: "center", justifyContent: "center", marginTop: 1 },
  aiInsightText: { flex: 1, fontSize: 13, color: "#5A4A7A", fontFamily: "Inter_400Regular", lineHeight: 20 },
  aiBars: { borderTopWidth: 1, borderTopColor: "#E8E2FF", paddingTop: 14, marginTop: 4 },
  aiBarsLabel: { fontSize: 11, fontWeight: "700", color: "#A090B8", fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  aiNotes: { borderTopWidth: 1, borderTopColor: "#E8E2FF", paddingTop: 14, marginTop: 8, gap: 12 },
  aiNoteItem: { gap: 4 },
  aiNoteLabel: { fontSize: 10, fontWeight: "700", color: "#A090B8", fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.4 },
  aiNoteValue: { fontSize: 12, color: "#5A4A7A", fontFamily: "Inter_400Regular", lineHeight: 18 },

  /* ── Empty drawings ── */
  emptyDrawings: { alignItems: "center", paddingTop: 20, gap: 12 },
  emptyDrawingsIcon: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  emptyDrawingsTitle: { fontSize: 17, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  emptyDrawingsSub: { fontSize: 13, color: "#A090B8", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 260 },
  emptyDrawingsBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 20, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14, elevation: 8 },
  emptyDrawingsBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
});

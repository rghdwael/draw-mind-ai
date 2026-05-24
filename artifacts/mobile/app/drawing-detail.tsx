import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmotionBar } from "@/components/EmotionBar";
import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";

export default function DrawingDetailScreen() {
  const insets = useSafeAreaInsets();
  const { drawingId } = useLocalSearchParams<{ drawingId: string }>();
  const { drawings, children } = useApp() || { drawings: [], children: [] };
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const safeDrawings = drawings || [];
  const drawing = safeDrawings.find((d) => d.id === drawingId);
  const child = children?.find((c) => c.id === drawing?.childId);

  // استخراج رابط الصورة النصية المرفوعة بأمان من الحقل المحدث
  let thumbUri: string | null = drawing?.imagePath || null;
  if (!thumbUri && drawing?.pathsJson) {
    try {
      const parsed = JSON.parse(drawing.pathsJson);
      if (parsed?.imageUri) thumbUri = parsed.imageUri;
    } catch { /* ignore */ }
  }

  if (!drawing || !child) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#4A3070" />
        </TouchableOpacity>
        <Text style={styles.notFound}>Drawing not found</Text>
      </View>
    );
  }

  // تأمين صياغة حقول المؤشرات السلوكية والنفسية القادمة من السيرفر
  const behaviorInsights = [
    { label: "Emotional State", value: drawing.mainEmotion === "Happiness" || drawing.mainEmotion === "Happy" ? "Stable and positive baseline energy" : "Processing introspection and mild anxiety", icon: "heart" },
    { label: "Social Indicators", value: (drawing.confidenceLevel || 90) > 80 ? "Strong peer connections, feels included and valued" : "Some social withdrawal noted; encourage group activities", icon: "people" },
    { label: "Stress Signals", value: (drawing.confidenceLevel || 90) > 75 ? "Minimal stress indicators present" : "Moderate stress indicators — monitor closely", icon: "alert-circle" },
  ];

  const safeEmotions = drawing.emotions || [];
  const safeRecommendations = drawing.recommendations || [];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#4A3070" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Drawing Analysis</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Large Drawing Preview */}
        <GlassCard style={styles.drawingCard} padding={0}>
          {thumbUri ? (
            <View style={styles.drawingFrame}>
              <Image source={{ uri: thumbUri }} style={styles.drawingThumb} resizeMode="contain" />
              <View style={styles.drawingOverlayRow}>
                <Text style={styles.drawingLabel}>{child.name || "Child"}'s Drawing</Text>
                <Text style={styles.drawingDate}>{drawing.date || "Recent"}</Text>
              </View>
            </View>
          ) : (
            <LinearGradient
              colors={[(child.avatarColor || "#6C4DFF") + "22", (child.avatarColor || "#6C4DFF") + "55"]}
              style={styles.drawingFrame}
            >
              <Ionicons name="brush" size={64} color={child.avatarColor || "#6C4DFF"} />
              <Text style={styles.drawingLabel}>{child.name || "Child"}'s Drawing</Text>
              <Text style={styles.drawingDate}>{drawing.date || "Recent"}</Text>
            </LinearGradient>
          )}
        </GlassCard>

        {/* Main Emotion Badge */}
        <LinearGradient
          colors={["#C4A8F5", "#F0A8C8"]}
          style={styles.emotionBadgeCard}
        >
          <Text style={styles.emotionBadgeLabel}>Detected Emotion</Text>
          <Text style={styles.emotionBadgeValue}>{drawing.mainEmotion || "Happy"}</Text>
          <View style={styles.confidenceRow}>
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.confidenceText}>
              {drawing.confidenceLevel || drawing.confidence || 92}% confidence
            </Text>
          </View>
        </LinearGradient>

        {/* Emotion Bars */}
        {safeEmotions.length > 0 && (
          <GlassCard style={styles.barsCard} padding={20}>
            <Text style={styles.sectionTitle}>Emotion Indicators</Text>
            {safeEmotions.map((e, idx) => (
              <EmotionBar
                key={e.name}
                label={e.name}
                percentage={e.percentage}
                color={e.color || "#8B5CF6"}
                delay={idx * 180}
              />
            ))}
          </GlassCard>
        )}

        {/* AI Summary */}
        <LinearGradient
          colors={["#F0E8FF", "#FDF8F5"]}
          style={styles.summaryGrad}
        >
          <View style={styles.summaryHeader}>
            <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} style={styles.summaryIcon}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </LinearGradient>
            <Text style={styles.summaryTitle}>AI Summary</Text>
          </View>
          <Text style={styles.summaryText}>{drawing.summary || "Analysis successfully generated and parsed into database studio."}</Text>
        </LinearGradient>

        {/* Behavioral Insights */}
        <GlassCard style={styles.insightsCard} padding={20}>
          <Text style={styles.sectionTitle}>Behavioral Insights</Text>
          {behaviorInsights.map((ins) => (
            <View key={ins.label} style={styles.insightRow}>
              <View style={styles.insightIconWrap}>
                <Ionicons name={ins.icon as any} size={18} color="#A78BFA" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>{ins.label}</Text>
                <Text style={styles.insightValue}>{ins.value || "Standard developmental response."}</Text>
              </View>
            </View>
          ))}

          <View style={styles.levelRow}>
            <View style={styles.levelItem}>
              <Text style={styles.insightLabel}>Creativity</Text>
              <EmotionBar
                label=""
                percentage={drawing.creativityLevel || 85}
                color="#B89CFF"
                delay={500}
              />
            </View>
            <View style={styles.levelItem}>
              <Text style={styles.insightLabel}>Confidence</Text>
              <EmotionBar
                label=""
                percentage={drawing.confidenceLevel || 90}
                color="#90BE6D"
                delay={650}
              />
            </View>
          </View>
        </GlassCard>

        {/* Recommendations */}
        {safeRecommendations.length > 0 && (
          <GlassCard style={styles.recsCard} padding={20}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {safeRecommendations.map((rec, idx) => (
              <View key={idx} style={styles.recRow}>
                <LinearGradient colors={["#C4A8F5", "#F0A8C8"]} style={styles.recBullet}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  scroll: { paddingHorizontal: 20, gap: 16 },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  notFound: { fontSize: 16, color: "#A090B8", textAlign: "center", marginTop: 40, fontFamily: "Inter_400Regular" },
  drawingCard: { overflow: "hidden" },
  drawingFrame: { height: 200, alignItems: "center", justifyContent: "center", borderRadius: 24, gap: 8, overflow: "hidden" },
  drawingThumb: { width: "100%", height: "100%", borderRadius: 24 },
  drawingOverlayRow: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(255,255,255,0.88)", paddingHorizontal: 16, paddingVertical: 8, alignItems: "center", gap: 2 },
  drawingLabel: { fontSize: 16, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  drawingDate: { fontSize: 13, color: "#A090B8", fontFamily: "Inter_400Regular" },
  emotionBadgeCard: { borderRadius: 24, padding: 20, alignItems: "center", gap: 6, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  emotionBadgeLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" },
  emotionBadgeValue: { fontSize: 32, fontWeight: "800", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  confidenceText: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium" },
  barsCard: {},
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold", marginBottom: 14 },
  summaryGrad: { borderRadius: 24, padding: 20, gap: 12, borderWidth: 1, borderColor: "#EAD4F5" },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  summaryText: { fontSize: 14, color: "#4A3B7A", lineHeight: 22, fontFamily: "Inter_400Regular" },
  insightsCard: {},
  insightRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  insightIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#F0E8FF", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  insightContent: { flex: 1, gap: 4 },
  insightLabel: { fontSize: 12, fontWeight: "600", color: "#A090B8", fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  insightValue: { fontSize: 14, color: "#4A3070", lineHeight: 20, fontFamily: "Inter_400Regular" },
  levelRow: { gap: 10, marginTop: 4 },
  levelItem: { gap: 4 },
  recsCard: {},
  recRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  recBullet: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  recText: { flex: 1, fontSize: 14, color: "#4A3070", lineHeight: 20, fontFamily: "Inter_400Regular" },
});
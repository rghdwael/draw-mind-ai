import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
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
  const { drawings, children } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const drawing = drawings.find((d) => d.id === drawingId);
  const child = children.find((c) => c.id === drawing?.childId);

  if (!drawing || !child) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A0F2E" />
        </TouchableOpacity>
        <Text style={styles.notFound}>Drawing not found</Text>
      </View>
    );
  }

  const behaviorInsights = [
    { label: "Emotional State", value: drawing.emotionalState, icon: "heart" },
    { label: "Social Indicators", value: drawing.socialIndicators, icon: "people" },
    { label: "Stress Signals", value: drawing.stressSignals, icon: "alert-circle" },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1A0F2E" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Drawing Analysis</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Large Drawing Preview */}
        <GlassCard style={styles.drawingCard} padding={0}>
          <LinearGradient
            colors={[child.avatarColor + "22", child.avatarColor + "55"]}
            style={styles.drawingFrame}
          >
            <Ionicons name="brush" size={64} color={child.avatarColor} />
            <Text style={styles.drawingLabel}>{child.name}'s Drawing</Text>
            <Text style={styles.drawingDate}>{drawing.date}</Text>
          </LinearGradient>
        </GlassCard>

        {/* Main Emotion Badge */}
        <LinearGradient
          colors={["#6C4DFF", "#9B7FFF"]}
          style={styles.emotionBadgeCard}
        >
          <Text style={styles.emotionBadgeLabel}>Detected Emotion</Text>
          <Text style={styles.emotionBadgeValue}>{drawing.mainEmotion}</Text>
          <View style={styles.confidenceRow}>
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.confidenceText}>
              {drawing.confidence}% confidence
            </Text>
          </View>
        </LinearGradient>

        {/* Emotion Bars */}
        <GlassCard style={styles.barsCard} padding={20}>
          <Text style={styles.sectionTitle}>Emotion Indicators</Text>
          {drawing.emotions.map((e, idx) => (
            <EmotionBar
              key={e.name}
              label={e.name}
              percentage={e.percentage}
              color={e.color}
              delay={idx * 180}
            />
          ))}
        </GlassCard>

        {/* AI Summary */}
        <LinearGradient
          colors={["#EDE9FF", "#F5F1FF"]}
          style={styles.summaryGrad}
        >
          <View style={styles.summaryHeader}>
            <LinearGradient colors={["#6C4DFF", "#9B7FFF"]} style={styles.summaryIcon}>
              <Ionicons name="brain" size={16} color="#fff" />
            </LinearGradient>
            <Text style={styles.summaryTitle}>AI Summary</Text>
          </View>
          <Text style={styles.summaryText}>{drawing.summary}</Text>
        </LinearGradient>

        {/* Behavioral Insights */}
        <GlassCard style={styles.insightsCard} padding={20}>
          <Text style={styles.sectionTitle}>Behavioral Insights</Text>
          {behaviorInsights.map((ins) => (
            <View key={ins.label} style={styles.insightRow}>
              <View style={styles.insightIconWrap}>
                <Ionicons name={ins.icon as any} size={18} color="#6C4DFF" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>{ins.label}</Text>
                <Text style={styles.insightValue}>{ins.value}</Text>
              </View>
            </View>
          ))}

          <View style={styles.levelRow}>
            <View style={styles.levelItem}>
              <Text style={styles.insightLabel}>Creativity</Text>
              <EmotionBar
                label=""
                percentage={drawing.creativityLevel}
                color="#B89CFF"
                delay={500}
              />
            </View>
            <View style={styles.levelItem}>
              <Text style={styles.insightLabel}>Confidence</Text>
              <EmotionBar
                label=""
                percentage={drawing.confidenceLevel}
                color="#90BE6D"
                delay={650}
              />
            </View>
          </View>
        </GlassCard>

        {/* Recommendations */}
        <GlassCard style={styles.recsCard} padding={20}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {drawing.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.recRow}>
              <LinearGradient colors={["#6C4DFF", "#9B7FFF"]} style={styles.recBullet}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </LinearGradient>
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </GlassCard>
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
    gap: 16,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  notFound: {
    fontSize: 16,
    color: "#8B7BAB",
    textAlign: "center",
    marginTop: 40,
    fontFamily: "Inter_400Regular",
  },
  drawingCard: {
    overflow: "hidden",
  },
  drawingFrame: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    gap: 8,
  },
  drawingLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  drawingDate: {
    fontSize: 13,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  emotionBadgeCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 6,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emotionBadgeLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
  },
  emotionBadgeValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confidenceText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_500Medium",
  },
  barsCard: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  summaryGrad: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#DDD6FF",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  summaryText: {
    fontSize: 14,
    color: "#4A3B7A",
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  insightsCard: {},
  insightRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  insightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  insightContent: { flex: 1, gap: 4 },
  insightLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B7BAB",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    color: "#1A0F2E",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  levelRow: {
    gap: 10,
    marginTop: 4,
  },
  levelItem: { gap: 4 },
  recsCard: {},
  recRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  recBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  recText: {
    flex: 1,
    fontSize: 14,
    color: "#1A0F2E",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
});

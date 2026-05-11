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

const INSIGHT_ICONS: Record<string, string> = {
  "Emotional State": "heart",
  "Social Indicators": "people",
  "Stress Signals": "alert-circle",
  "Creativity Level": "color-palette",
  "Confidence Level": "star",
};

function CircleScore({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={cs.circleWrap}>
      <View style={[cs.circle, { borderColor: color }]}>
        <Text style={[cs.circleNum, { color }]}>{value}%</Text>
      </View>
      <Text style={cs.circleLabel}>{label}</Text>
    </View>
  );
}

const cs = StyleSheet.create({
  circleWrap: { alignItems: "center", gap: 6 },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F1FF",
  },
  circleNum: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  circleLabel: {
    fontSize: 11,
    color: "#8B7BAB",
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    maxWidth: 72,
  },
});

export default function AnalysisResultScreen() {
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { drawings, children } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const child = children.find((c) => c.id === childId);
  const latestDrawing = drawings.find((d) => d.childId === childId);

  if (!latestDrawing) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#1A0F2E" />
        </TouchableOpacity>
        <Text style={styles.noDataText}>No analysis found</Text>
      </View>
    );
  }

  const behaviorInsights = [
    {
      label: "Emotional State",
      value: latestDrawing.emotionalState,
    },
    {
      label: "Social Indicators",
      value: latestDrawing.socialIndicators,
    },
    {
      label: "Stress Signals",
      value: latestDrawing.stressSignals,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#1A0F2E" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>AI Analysis</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Drawing Preview */}
        <GlassCard style={styles.drawingPreview} padding={24}>
          <View style={styles.thumbOuter}>
            <LinearGradient
              colors={["#EDE9FF", "#DDD6FF"]}
              style={styles.thumbInner}
            >
              <Ionicons name="brush" size={40} color="#6C4DFF" />
            </LinearGradient>
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewChildName}>{child?.name}'s Drawing</Text>
            <Text style={styles.previewDate}>{latestDrawing.date}</Text>
          </View>
        </GlassCard>

        {/* Main Emotion */}
        <LinearGradient
          colors={["#6C4DFF", "#9B7FFF"]}
          style={styles.mainEmotionCard}
        >
          <Text style={styles.mainEmotionLabel}>Main Emotion</Text>
          <Text style={styles.mainEmotionValue}>{latestDrawing.mainEmotion}</Text>
          <Text style={styles.mainEmotionConf}>
            {latestDrawing.confidence}% confidence
          </Text>
        </LinearGradient>

        {/* Emotion Circles */}
        <GlassCard style={styles.circlesCard} padding={20}>
          <Text style={styles.sectionTitle}>Emotion Breakdown</Text>
          <View style={styles.circlesRow}>
            {latestDrawing.emotions.slice(0, 4).map((e) => (
              <CircleScore
                key={e.name}
                label={e.name}
                value={e.percentage}
                color={e.color}
              />
            ))}
          </View>
        </GlassCard>

        {/* Emotion Bars */}
        <GlassCard style={styles.barsCard} padding={20}>
          <Text style={styles.sectionTitle}>Detailed Scores</Text>
          {latestDrawing.emotions.map((e, idx) => (
            <EmotionBar
              key={e.name}
              label={e.name}
              percentage={e.percentage}
              color={e.color}
              delay={idx * 150}
            />
          ))}
        </GlassCard>

        {/* AI Summary */}
        <LinearGradient
          colors={["#F5F1FF", "#EDE9FF"]}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <LinearGradient
              colors={["#6C4DFF", "#9B7FFF"]}
              style={styles.summaryIcon}
            >
              <Ionicons name="brain" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.summaryTitle}>AI Summary</Text>
          </View>
          <Text style={styles.summaryText}>{latestDrawing.summary}</Text>
        </LinearGradient>

        {/* Behavioral Insights */}
        <GlassCard style={styles.insightsCard} padding={20}>
          <Text style={styles.sectionTitle}>Behavioral Insights</Text>
          <View style={styles.insightsList}>
            {behaviorInsights.map((ins) => (
              <View key={ins.label} style={styles.insightItem}>
                <View style={styles.insightIconWrap}>
                  <Ionicons
                    name={
                      (INSIGHT_ICONS[ins.label] as any) ??
                      "information-circle-outline"
                    }
                    size={18}
                    color="#6C4DFF"
                  />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>{ins.label}</Text>
                  <Text style={styles.insightValue}>{ins.value}</Text>
                </View>
              </View>
            ))}
            <View style={styles.insightItem}>
              <View style={styles.insightIconWrap}>
                <Ionicons name="color-palette" size={18} color="#6C4DFF" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>Creativity Level</Text>
                <EmotionBar
                  label=""
                  percentage={latestDrawing.creativityLevel}
                  color="#B89CFF"
                  delay={500}
                />
              </View>
            </View>
            <View style={styles.insightItem}>
              <View style={styles.insightIconWrap}>
                <Ionicons name="star" size={18} color="#6C4DFF" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>Confidence Level</Text>
                <EmotionBar
                  label=""
                  percentage={latestDrawing.confidenceLevel}
                  color="#90BE6D"
                  delay={650}
                />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Recommendations */}
        <GlassCard style={styles.recsCard} padding={20}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recsList}>
            {latestDrawing.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recItem}>
                <LinearGradient
                  colors={["#6C4DFF", "#9B7FFF"]}
                  style={styles.recNum}
                >
                  <Text style={styles.recNumText}>{idx + 1}</Text>
                </LinearGradient>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Done Button */}
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <LinearGradient
            colors={["#6C4DFF", "#9B7FFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  noDataText: {
    fontSize: 16,
    color: "#8B7BAB",
    textAlign: "center",
    marginTop: 40,
    fontFamily: "Inter_400Regular",
  },
  drawingPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  thumbOuter: {
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  thumbInner: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: { gap: 4 },
  previewChildName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  previewDate: {
    fontSize: 13,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  mainEmotionCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 6,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mainEmotionLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_500Medium",
  },
  mainEmotionValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  mainEmotionConf: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
  },
  circlesCard: {},
  circlesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  barsCard: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  summaryCard: {
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
    width: 36,
    height: 36,
    borderRadius: 12,
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
  insightsList: { gap: 14 },
  insightItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  insightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  insightContent: { flex: 1, gap: 4 },
  insightLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B7BAB",
    fontFamily: "Inter_600SemiBold",
  },
  insightValue: {
    fontSize: 14,
    color: "#1A0F2E",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  recsCard: {},
  recsList: { gap: 12 },
  recItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  recNumText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  recText: {
    flex: 1,
    fontSize: 14,
    color: "#1A0F2E",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  doneBtn: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
});

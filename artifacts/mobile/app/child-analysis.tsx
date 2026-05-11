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
import { ChildAvatar } from "@/components/ChildAvatar";
import { EmotionBar } from "@/components/EmotionBar";
import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";

export default function ChildAnalysisScreen() {
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { children, drawings, getChildEmotionSummary } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const child = children.find((c) => c.id === childId);
  const childDrawings = drawings.filter((d) => d.childId === childId);

  if (!child) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A0F2E" />
        </TouchableOpacity>
        <Text style={styles.notFound}>Child not found</Text>
      </View>
    );
  }

  const emotionSummaries: Record<string, number> = {};
  childDrawings.forEach((d) => {
    const emotion = d.mainEmotion;
    emotionSummaries[emotion] = (emotionSummaries[emotion] ?? 0) + 1;
  });
  const total = childDrawings.length;
  const emotionBars = Object.entries(emotionSummaries).map(([name, count]) => ({
    name,
    pct: Math.round((count / Math.max(total, 1)) * 100),
  }));

  const emotionColors: Record<string, string> = {
    Happy: "#90BE6D",
    Sad: "#577590",
    Angry: "#F3722C",
    Anxiety: "#F8961E",
    Calm: "#48CAE4",
    Excited: "#B89CFF",
    Fear: "#9B7FFF",
  };

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
          <Text style={styles.navTitle}>Analysis</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Child Hero */}
        <GlassCard style={styles.heroCard} padding={24}>
          <ChildAvatar
            name={child.name}
            initials={child.initials}
            avatarColor={child.avatarColor}
            size={88}
            showName={false}
          />
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.childAge}>Age {child.age}</Text>
          <Text style={styles.emotionBadge}>
            {getChildEmotionSummary(child.id)}
          </Text>
          <View style={styles.totalRow}>
            <Ionicons name="brush" size={16} color="#6C4DFF" />
            <Text style={styles.totalText}>{childDrawings.length} total drawings</Text>
          </View>
        </GlassCard>

        {/* Emotion Overview */}
        {emotionBars.length > 0 && (
          <GlassCard style={styles.emotionCard} padding={20}>
            <Text style={styles.sectionTitle}>Emotional Overview</Text>
            {emotionBars.map((eb, idx) => (
              <EmotionBar
                key={eb.name}
                label={eb.name}
                percentage={eb.pct}
                color={emotionColors[eb.name] ?? "#6C4DFF"}
                delay={idx * 150}
              />
            ))}
          </GlassCard>
        )}

        {/* Drawings Gallery */}
        <Text style={styles.sectionTitle2}>Drawing Gallery</Text>
        {childDrawings.length === 0 ? (
          <GlassCard style={styles.emptyCard} padding={36}>
            <Ionicons name="brush-outline" size={48} color="#B89CFF" />
            <Text style={styles.emptyTitle}>No Drawings Yet</Text>
            <Text style={styles.emptyText}>
              Use the Draw button on the Home screen to create a drawing for{" "}
              {child.name}
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.gallery}>
            {childDrawings.map((drawing) => (
              <TouchableOpacity
                key={drawing.id}
                onPress={() =>
                  router.push({
                    pathname: "/drawing-detail",
                    params: { drawingId: drawing.id },
                  })
                }
                style={styles.galleryItemWrap}
              >
                <GlassCard style={styles.galleryItem} padding={14}>
                  <LinearGradient
                    colors={[child.avatarColor + "22", child.avatarColor + "44"]}
                    style={styles.galleryThumb}
                  >
                    <Ionicons name="brush" size={24} color={child.avatarColor} />
                  </LinearGradient>
                  <Text style={styles.galleryDate}>{drawing.date}</Text>
                  <Text style={styles.galleryEmotion}>{drawing.mainEmotion}</Text>
                  <Text
                    style={[
                      styles.galleryConf,
                      {
                        color:
                          emotionColors[drawing.mainEmotion] ?? "#6C4DFF",
                      },
                    ]}
                  >
                    {drawing.confidence}%
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  heroCard: {
    alignItems: "center",
    gap: 6,
  },
  childName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  childAge: {
    fontSize: 14,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  emotionBadge: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6C4DFF",
    fontFamily: "Inter_700Bold",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  totalText: {
    fontSize: 13,
    color: "#8B7BAB",
    fontFamily: "Inter_500Medium",
  },
  emotionCard: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  sectionTitle2: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  emptyCard: {
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  galleryItemWrap: {
    width: "47%",
  },
  galleryItem: {
    alignItems: "center",
    gap: 6,
  },
  galleryThumb: {
    width: "100%",
    height: 80,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  galleryDate: {
    fontSize: 10,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  galleryEmotion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  galleryConf: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});

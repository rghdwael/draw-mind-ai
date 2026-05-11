import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChildAvatar } from "@/components/ChildAvatar";
import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";

const EMOTION_COLORS: Record<string, string> = {
  Happy: "#90BE6D",
  Sad: "#577590",
  Angry: "#F3722C",
  Anxiety: "#F8961E",
  Fear: "#9B7FFF",
};

function getEmotionColor(emotion: string) {
  return EMOTION_COLORS[emotion] ?? "#6C4DFF";
}

export default function DrawingsScreen() {
  const insets = useSafeAreaInsets();
  const { children, drawings, getChildEmotionSummary } = useApp();
  const [activeFilter, setActiveFilter] = useState("All");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filterTabs = ["All", ...children.map((c) => c.name)];

  const filteredDrawings =
    activeFilter === "All"
      ? drawings
      : drawings.filter((d) => {
          const child = children.find((c) => c.id === d.childId);
          return child?.name === activeFilter;
        });

  const filteredChildren =
    activeFilter === "All"
      ? children
      : children.filter((c) => c.name === activeFilter);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.pageTitle}>Children's Draw</Text>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(tab);
              }}
            >
              {activeFilter === tab ? (
                <LinearGradient
                  colors={["#6C4DFF", "#9B7FFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabActive}
                >
                  <Text style={styles.tabTextActive}>{tab}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <Text style={styles.tabTextInactive}>{tab}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Children Cards */}
        {filteredChildren.map((child) => {
          const childDrawings = drawings.filter((d) => d.childId === child.id);
          return (
            <View key={child.id} style={styles.childSection}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/child-analysis",
                    params: { childId: child.id },
                  })
                }
              >
                <GlassCard style={styles.childCard} padding={16}>
                  <View style={styles.childCardLeft}>
                    <ChildAvatar
                      name={child.name}
                      initials={child.initials}
                      avatarColor={child.avatarColor}
                      size={52}
                      showName={false}
                    />
                    <View style={styles.childCardInfo}>
                      <Text style={styles.childCardName}>{child.name}</Text>
                      <Text style={styles.childCardMeta}>
                        {childDrawings.length} drawings
                      </Text>
                      <Text style={styles.childEmotionBadge}>
                        {getChildEmotionSummary(child.id)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#B89CFF" />
                </GlassCard>
              </TouchableOpacity>

              {/* Drawing Cards */}
              {childDrawings.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.drawingsRow}
                >
                  {childDrawings.map((drawing) => (
                    <TouchableOpacity
                      key={drawing.id}
                      onPress={() =>
                        router.push({
                          pathname: "/drawing-detail",
                          params: { drawingId: drawing.id },
                        })
                      }
                    >
                      <GlassCard style={styles.drawingCard} padding={14}>
                        <View
                          style={[
                            styles.drawingThumb,
                            { backgroundColor: child.avatarColor + "22" },
                          ]}
                        >
                          <Ionicons
                            name="brush"
                            size={28}
                            color={child.avatarColor}
                          />
                        </View>
                        <Text style={styles.drawingDate}>{drawing.date}</Text>
                        <Text style={styles.drawingEmotion}>
                          {drawing.mainEmotion}
                        </Text>
                        <Text
                          style={[
                            styles.drawingConf,
                            { color: getEmotionColor(drawing.mainEmotion) },
                          ]}
                        >
                          {drawing.confidence}%
                        </Text>
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {childDrawings.length === 0 && (
                <GlassCard style={styles.emptyCard} padding={20}>
                  <Ionicons name="brush-outline" size={32} color="#B89CFF" />
                  <Text style={styles.emptyText}>No drawings yet</Text>
                </GlassCard>
              )}
            </View>
          );
        })}

        {filteredChildren.length === 0 && (
          <GlassCard style={styles.bigEmpty} padding={40}>
            <Ionicons name="images-outline" size={48} color="#B89CFF" />
            <Text style={styles.bigEmptyTitle}>No Children Added</Text>
            <Text style={styles.bigEmptyText}>
              Add children from the Home screen to start tracking their
              drawings
            </Text>
          </GlassCard>
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
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    marginBottom: 18,
  },
  tabsRow: {
    gap: 10,
    paddingBottom: 18,
    paddingHorizontal: 2,
  },
  tabActive: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  tabInactive: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD6FF",
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  tabTextInactive: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B7BAB",
    fontFamily: "Inter_600SemiBold",
  },
  childSection: {
    marginBottom: 24,
  },
  childCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  childCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  childCardInfo: { gap: 2 },
  childCardName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  childCardMeta: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  childEmotionBadge: {
    fontSize: 12,
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    marginTop: 2,
  },
  drawingsRow: {
    gap: 12,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  drawingCard: {
    width: 120,
    alignItems: "center",
    gap: 6,
  },
  drawingThumb: {
    width: 72,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  drawingDate: {
    fontSize: 10,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  drawingEmotion: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  drawingConf: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyCard: {
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#8B7BAB",
    fontFamily: "Inter_500Medium",
  },
  bigEmpty: {
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  bigEmptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  bigEmptyText: {
    fontSize: 14,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});

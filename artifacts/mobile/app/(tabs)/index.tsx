import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
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
import { ChildAvatar } from "@/components/ChildAvatar";
import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function ActionButton({
  icon,
  label,
  colors,
  onPress,
}: {
  icon: string;
  label: string;
  colors: [string, string];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.actionBtnWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionBtn}
        >
          <Ionicons name={icon as any} size={28} color="#fff" />
          <Text style={styles.actionLabel}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userName, children, drawings, getChildEmotionSummary } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 12, paddingBottom: 90 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Greeting */}
        <LinearGradient
          colors={["#6C4DFF", "#9B7FFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingCard}
        >
          <View style={styles.greetingLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.greetingName}>{userName}</Text>
            <Text style={styles.greetingSubtitle}>
              Track your children's emotions today
            </Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {userName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} padding={16}>
            <Text style={styles.statNum}>{children.length}</Text>
            <Text style={styles.statLabel}>Children</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={16}>
            <Text style={styles.statNum}>{drawings.length}</Text>
            <Text style={styles.statLabel}>Drawings</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={16}>
            <Text style={styles.statNum}>
              {drawings.length > 0
                ? Math.round(
                    (drawings.filter((d) =>
                      d.mainEmotion.toLowerCase().includes("happy")
                    ).length /
                      drawings.length) *
                      100
                  )
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>Happy</Text>
          </GlassCard>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <ActionButton
              icon="cloud-upload"
              label="Upload Drawing"
              colors={["#6C4DFF", "#9B7FFF"]}
              onPress={() => router.push("/choose-child")}
            />
            <ActionButton
              icon="brush"
              label="Draw"
              colors={["#B89CFF", "#8B6BFF"]}
              onPress={() => router.push("/choose-child")}
            />
          </View>
        </View>

        {/* My Children */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Children</Text>
            <TouchableOpacity onPress={() => router.push("/add-child")}>
              <Text style={styles.seeAll}>Manage</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childrenRow}
          >
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/child-analysis",
                    params: { childId: child.id },
                  });
                }}
                style={styles.childItem}
              >
                <ChildAvatar
                  name={child.name}
                  initials={child.initials}
                  avatarColor={child.avatarColor}
                  size={68}
                  showName={true}
                />
                <Text style={styles.emotionBadge}>
                  {getChildEmotionSummary(child.id)}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Add Child Button */}
            <TouchableOpacity
              onPress={() => router.push("/add-child")}
              style={styles.childItem}
            >
              <LinearGradient
                colors={["#EDE9FF", "#DDD6FF"]}
                style={styles.addChildCircle}
              >
                <Ionicons name="add" size={28} color="#6C4DFF" />
              </LinearGradient>
              <Text style={styles.addChildLabel}>Add Child</Text>
              <Text style={styles.emotionBadge}> </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Drawings</Text>
          {drawings.slice(0, 3).map((drawing) => {
            const child = children.find((c) => c.id === drawing.childId);
            return (
              <TouchableOpacity
                key={drawing.id}
                onPress={() =>
                  router.push({
                    pathname: "/drawing-detail",
                    params: { drawingId: drawing.id },
                  })
                }
              >
                <GlassCard style={styles.recentCard} padding={16}>
                  <View style={styles.recentLeft}>
                    {child && (
                      <ChildAvatar
                        name={child.name}
                        initials={child.initials}
                        avatarColor={child.avatarColor}
                        size={44}
                        showName={false}
                      />
                    )}
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentChild}>{child?.name}</Text>
                      <Text style={styles.recentDate}>{drawing.date}</Text>
                    </View>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={styles.recentEmotion}>{drawing.mainEmotion}</Text>
                    <Text style={styles.recentConf}>{drawing.confidence}%</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
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
    gap: 4,
  },
  greetingCard: {
    borderRadius: 28,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  greetingLeft: { flex: 1 },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
  },
  greetingName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    marginVertical: 2,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 24,
    fontWeight: "800",
    color: "#6C4DFF",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 13,
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 14,
  },
  actionBtnWrap: {
    flex: 1,
  },
  actionBtn: {
    borderRadius: 22,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  childrenRow: {
    gap: 18,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  childItem: {
    alignItems: "center",
    gap: 4,
  },
  emotionBadge: {
    fontSize: 11,
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  addChildCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#DDD6FF",
    borderStyle: "dashed",
  },
  addChildLabel: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_500Medium",
  },
  recentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recentInfo: { gap: 2 },
  recentChild: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A0F2E",
    fontFamily: "Inter_600SemiBold",
  },
  recentDate: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  recentRight: { alignItems: "flex-end" },
  recentEmotion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6C4DFF",
    fontFamily: "Inter_700Bold",
  },
  recentConf: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_500Medium",
  },
});

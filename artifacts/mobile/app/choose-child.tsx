import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { useApp } from "@/context/AppContext";

export default function ChooseChildScreen() {
  const insets = useSafeAreaInsets();
  const { children, getChildEmotionSummary } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleNext = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/drawing-canvas",
      params: { childId: selected },
    });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad, paddingBottom: botPad + 20 },
      ]}
    >
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A0F2E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Choose Child</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        Select the child whose drawing you want to analyze
      </Text>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {children.map((child) => {
          const isSelected = selected === child.id;
          return (
            <TouchableOpacity
              key={child.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelected(child.id);
              }}
            >
              <GlassCard
                style={[
                  styles.childCard,
                  isSelected && styles.childCardSelected,
                ]}
                padding={18}
              >
                <ChildAvatar
                  name={child.name}
                  initials={child.initials}
                  avatarColor={child.avatarColor}
                  size={64}
                  showName={false}
                  selected={isSelected}
                />
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childAge}>Age {child.age}</Text>
                  <View style={styles.emotionRow}>
                    <View
                      style={[
                        styles.emotionDot,
                        { backgroundColor: child.avatarColor },
                      ]}
                    />
                    <Text style={styles.emotionText}>
                      {getChildEmotionSummary(child.id)}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <LinearGradient
                    colors={["#6C4DFF", "#9B7FFF"]}
                    style={styles.checkCircle}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </LinearGradient>
                )}
              </GlassCard>
            </TouchableOpacity>
          );
        })}

        {children.length === 0 && (
          <GlassCard style={styles.emptyCard} padding={36}>
            <Ionicons name="people-outline" size={48} color="#B89CFF" />
            <Text style={styles.emptyTitle}>No Children Yet</Text>
            <Text style={styles.emptyText}>
              Go back and add a child first from the Home screen
            </Text>
          </GlassCard>
        )}
      </ScrollView>

      {children.length > 0 && (
        <View style={styles.footer}>
          <GradientButton
            label="Start Drawing"
            onPress={handleNext}
            disabled={!selected}
            size="lg"
            style={{ width: "100%" }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1FF",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  subtitle: {
    fontSize: 14,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 16,
  },
  childCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  childCardSelected: {
    borderColor: "#6C4DFF",
    borderWidth: 2,
  },
  childInfo: { flex: 1, gap: 4 },
  childName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  childAge: {
    fontSize: 13,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  emotionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emotionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emotionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});

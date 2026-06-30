import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity, Image, Alert, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useApp } from "../context/AppContext";
import { Ionicons } from "@expo/vector-icons"; 
import { LinearGradient } from "expo-linear-gradient"; 

const EMOTION_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  Happy:     { color: "#16A34A", bg: "#DCFCE7", emoji: "😊" },
  Sadness:   { color: "#2563EB", bg: "#DBEAFE", emoji: "😢" },
  Anger:     { color: "#DC2626", bg: "#FEE2E2", emoji: "😡" },
  Fear:      { color: "#9333EA", bg: "#F3E8FF", emoji: "😨" },
  Mixed:     { color: "#D97706", bg: "#FEF3C7", emoji: "🌪️" },
};

function getEmotionStyle(emotion: string) {
  // If it's a combined string like "Sadness + Anger", default to Mixed style
  if (emotion.includes("+")) return EMOTION_CONFIG["Mixed"];
  return EMOTION_CONFIG[emotion] || EMOTION_CONFIG["Mixed"];
}

// ── Cleaned Up Drawing Card ──
function DrawingCard({ drawing, index, childId }: { drawing: any; index: number; childId: string }) {
  const appContext = useApp();
  const rawEmotion = drawing?.analysis?.emotional_status || "Pending";
  const lowerEmotion = rawEmotion.toLowerCase();
  
  // 🚨 REFINED LOGIC: 
  // 1. Only use "Mixed" if the AI explicitly says it is mixed.
  // 2. Otherwise, find all emotions present.
  let detected: string[] = [];
  
  if (lowerEmotion.includes("mixed emotions")) {
    detected = ["Mixed"];
  } else {
    // Check for each emotion individually, independent of others
    if (lowerEmotion.includes("happ") || lowerEmotion.includes("joy") || lowerEmotion.includes("positiv")) detected.push("Happy");
    if (lowerEmotion.includes("sad")) detected.push("Sadness");
    if (lowerEmotion.includes("ang") || lowerEmotion.includes("frustrat")) detected.push("Anger");
    if (lowerEmotion.includes("fear") || lowerEmotion.includes("anxi") || lowerEmotion.includes("scare") || lowerEmotion.includes("worr")) detected.push("Fear");
  }

  // If no specific emotions were found, default to rawEmotion, otherwise join findings
  const badgeText = detected.length > 0 ? detected.join(" + ") : rawEmotion;
  const emStyle = getEmotionStyle(badgeText);

  // Web-Safe Delete Logic
  const handleDeletePress = async () => {
    const executeDelete = async () => {
      try {
        const drawId = drawing.id || drawing.drawing_id;
        const response = await fetch(`http://127.0.0.1:8000/drawings/${drawId}`, { method: "DELETE" });
        if (response.ok) {
          if (appContext?.fetchDrawings) appContext.fetchDrawings(childId);
        } else {
          alert("Failed to delete drawing from server.");
        }
      } catch (error) {
        alert("Network connection error.");
      }
    };

    if (Platform.OS === "web") {
      const confirmWeb = window.confirm("Are you sure you want to permanently delete this drawing analysis?");
      if (confirmWeb) executeDelete();
    } else {
      Alert.alert("Delete Drawing", "Are you sure you want to permanently delete this drawing analysis?",
        [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: executeDelete }]
      );
    }
  };

  const drawingPath = drawing?.image_path || drawing?.imageUrl || "";
  const imageUri = drawingPath
    ? (drawingPath.startsWith("http") ? drawingPath : `http://127.0.0.1:8000${drawingPath}`)
    : "https://via.placeholder.com/150";

  return (
    <View style={styles.cardContainer}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "#EBF0FF", overflow: "hidden", marginRight: 16 }}>
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        </View>

        <View style={{ flex: 1, gap: 6, paddingTop: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#4A3070" }}>
            Drawing #{String(index + 1).padStart(2, "0")}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <View style={{ backgroundColor: emStyle.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              {/* 🚨 Shows exactly what the AI found, e.g., "Sadness + Anger" */}
              <Text style={{ fontSize: 11, color: emStyle.color, fontWeight: "bold" }}>{emStyle.emoji} {badgeText}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleDeletePress} style={{ backgroundColor: "#FEE2E2", borderRadius: 12, padding: 10, marginLeft: 8 }}>
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 4, borderTopWidth: 1, borderTopColor: "#F2F4F7", paddingTop: 16 }}>
        <TouchableOpacity 
          onPress={() => router.push({ pathname: "/analysis-result", params: { drawingId: drawing.id || drawing.drawing_id, childId: childId, freshImage: drawingPath } } as any)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#C4A8F5", "#D4B0F0", "#F0A8C8"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: "100%", borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "bold" }}>View Full Analysis</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen Component ──
export default function ChildAnalysisScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const appContext = useApp();
  
  useEffect(() => {
    if (appContext?.fetchDrawings && childId) {
      appContext.fetchDrawings(childId);
    }
  }, [childId, appContext]);

  if (!appContext) return <View style={styles.container}><Text style={{ padding: 20 }}>Context Connection Error</Text></View>;

  const { getChildDrawings, children } = appContext;
  const drawings = getChildDrawings ? getChildDrawings(childId || "") : [];
  const child = (children || []).find((c: any) => String(c.id) === String(childId));

  if (!child) return <View style={styles.container}><Text style={{ padding: 20, color: "#4C1D95", textAlign: "center", marginTop: 50 }}>Loading Profile...</Text></View>;

  const safeName = child?.name || "Unknown";
  const initials = child?.initials || safeName.substring(0, 2).toUpperCase() || "CH";
  const totalDrawings = drawings.length;

  // 🚨 2. Accurate Calculation Logic
  let happyCount = 0, sadCount = 0, angryCount = 0, fearCount = 0, mixedCount = 0;

  drawings.forEach((d: any) => {
    const status = (d?.analysis?.emotional_status || "").toLowerCase();
    
    // Only flag Mixed if explicitly told
    if (status.includes("mix")) { 
        mixedCount++; 
    } else {
        if (status.includes("happ") || status.includes("joy") || status.includes("positiv")) happyCount++;
        if (status.includes("sad")) sadCount++;
        if (status.includes("ang") || status.includes("frustrat")) angryCount++;
        if (status.includes("fear") || status.includes("anxi") || status.includes("scare") || status.includes("worr")) fearCount++;
    }
  });

  const getPct = (count: number) => totalDrawings > 0 ? Math.round((count / totalDrawings) * 100) : 0;
  const happyPct = getPct(happyCount);
  const sadPct = getPct(sadCount);
  const angryPct = getPct(angryCount);
  const fearPct = getPct(fearCount);
  const mixedPct = getPct(mixedCount);

  const totalNegativeOccurrences = sadCount + angryCount + fearCount;
  const negativeRatio = totalDrawings > 0 ? (totalNegativeOccurrences / totalDrawings) * 100 : 0;
  
  const stabilityLevel = negativeRatio <= 30 ? "High" : (negativeRatio <= 70 ? "Moderate" : "Low");
  const stabilityColor = stabilityLevel === "High" ? "#16A34A" : (stabilityLevel === "Moderate" ? "#D97706" : "#DC2626");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Header NavBar */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#F5F3FF", borderRadius: 12, borderWidth: 1, borderColor: "#EDE9FE" }}>
          <Text style={{ fontSize: 14, color: "#8B5CF6", fontWeight: "bold" }}>◀ Back</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#4C1D95" }}>Child Profile</Text>
      </View>

      {/* Child Profile Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: child?.avatarColor || "#6C4DFF" }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.childName}>{safeName}</Text>
        <Text style={styles.childInfo}>Age {child?.age || 0} • {child?.gender || "Not specified"}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalDrawings}</Text>
            <Text style={styles.statLabel}>Drawings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: stabilityColor }]}>{stabilityLevel}</Text>
            <Text style={styles.statLabel}>Stability</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity activeOpacity={0.85} style={[styles.quickBtn, { overflow: 'hidden' }]} onPress={() => router.push({ pathname: "/add-drawing", params: { childId } })}>
          <LinearGradient colors={["#C4A8F5", "#D4B0F0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtnBg}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.quickBtnText}>Upload</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} style={[styles.quickBtn, { overflow: 'hidden' }]} onPress={() => router.push({ pathname: "/drawing-canvas", params: { childId } })}>
          <LinearGradient colors={["#F0A8C8", "#C4A8F5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtnBg}>
            <Ionicons name="brush-outline" size={20} color="#fff" />
            <Text style={styles.quickBtnText}>Draw</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>AI Summary</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.aiText}>🔮 {safeName} demonstrates emotions across {totalDrawings} drawings.</Text>
        <Text style={styles.subSectionTitle}>OVERALL EMOTIONAL DISTRIBUTION</Text>
        <View style={styles.distributionRow}><Text style={styles.distLabel}>Happy</Text><View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${happyPct}%`, backgroundColor: "#16A34A" }]} /></View><Text style={styles.distValue}>{happyPct}%</Text></View>
        <View style={styles.distributionRow}><Text style={styles.distLabel}>Sad</Text><View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${sadPct}%`, backgroundColor: "#3B82F6" }]} /></View><Text style={styles.distValue}>{sadPct}%</Text></View>
        <View style={styles.distributionRow}><Text style={styles.distLabel}>Angry</Text><View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${angryPct}%`, backgroundColor: "#EF4444" }]} /></View><Text style={styles.distValue}>{angryPct}%</Text></View>
        <View style={styles.distributionRow}><Text style={styles.distLabel}>Fear</Text><View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${fearPct}%`, backgroundColor: "#8B5CF6" }]} /></View><Text style={styles.distValue}>{fearPct}%</Text></View>
        <View style={styles.distributionRow}><Text style={styles.distLabel}>Mixed</Text><View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${mixedPct}%`, backgroundColor: "#F59E0B" }]} /></View><Text style={styles.distValue}>{mixedPct}%</Text></View>
      </View>

      <Text style={styles.sectionTitle}>{safeName}'s Drawings</Text>
      {drawings.map((d: any, index: number) => (
        <DrawingCard key={d?.id || index} drawing={d} index={index} childId={childId || ""} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { padding: 16, paddingBottom: 40 },
  cardContainer: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#EDE9FE", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  headerCard: { backgroundColor: "#F5F3FF", borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 24 },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#FFF", fontSize: 24, fontWeight: "bold" },
  childName: { fontSize: 24, fontWeight: "bold", color: "#4C1D95", marginBottom: 4 },
  childInfo: { fontSize: 14, color: "#6D28D9", marginBottom: 12 },
  activitiesRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  activitiesText: { fontSize: 13, color: "#7C3AED" },
  statsRow: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 16, padding: 16, width: "100%", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  statBox: { alignItems: "center", flex: 1 },
  statNumber: { fontSize: 20, fontWeight: "bold", color: "#8B5CF6", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#9CA3AF" },
  statDivider: { width: 1, height: 30, backgroundColor: "#E5E7EB" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 12 },
  summaryCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#EDE9FE", marginBottom: 24 },
  aiText: { fontSize: 14, color: "#4B5563", lineHeight: 20, marginBottom: 20 },
  subSectionTitle: { fontSize: 11, fontWeight: "bold", color: "#6B7280", letterSpacing: 0.5, marginBottom: 8 },
  distributionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  distLabel: { fontSize: 13, color: "#374151", width: 45, fontWeight: "bold" },
  progressBarBg: { flex: 1, height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  distValue: { fontSize: 13, fontWeight: "bold", color: "#374151", width: 35, textAlign: "right" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 15, gap: 12 },
  quickBtn: { flex: 1, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  gradientBtnBg: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 8 },
  quickBtnText: { fontSize: 14, fontWeight: "bold", color: "#fff" },
});
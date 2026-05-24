import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useApp } from "../context/AppContext";
import { Ionicons } from "@expo/vector-icons"; // 💡 تأكدي من عمل import للأيقونات

const EMOTION_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  Happiness: { color: "#16A34A", bg: "#DCFCE7", emoji: "😊" },
  Happy:     { color: "#16A34A", bg: "#DCFCE7", emoji: "😊" },
  Sadness:   { color: "#2563EB", bg: "#DBEAFE", emoji: "😢" },
  Anger:     { color: "#DC2626", bg: "#FEE2E2", emoji: "😡" },
  Anxiety:   { color: "#D97706", bg: "#FEF3C7", emoji: "😰" },
  Fear:      { color: "#9333EA", bg: "#F3E8FF", emoji: "😨" },
};

function getEmotionStyle(emotion: string) {
  return EMOTION_CONFIG[emotion] || { color: "#7F56D9", bg: "#F5F3FF", emoji: "🎨" };
}

// ── مكوّن كرت الرسمة بتصميم ريبليت الأنيق المتمدد ──
import { Alert } from "react-native"; // 💡 تأكدي من إضافة Alert في الـ import العلوي للملف

function DrawingCard({ drawing, index, childId }: { drawing: any; index: number; childId: string }) {
  const [expanded, setExpanded] = useState(false);
  const appContext = useApp();
  const safeEmotion = drawing?.mainEmotion || "Happy";
  const emStyle = getEmotionStyle(safeEmotion);

  const happiness = drawing?.happiness || (safeEmotion === "Happy" || safeEmotion === "Happiness" ? 85 : 15);
  const anxiety = drawing?.anxiety || (safeEmotion === "Anxiety" ? 75 : 15);
  const sadness = drawing?.sadness || (safeEmotion === "Sadness" ? 70 : 10);

  // دالة التعامل مع ضغط زر المسح والتأكيد
  const handleDeletePress = () => {
    Alert.alert(
      "Delete Drawing",
      "Are you sure you want to permanently delete this drawing analysis?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            if (appContext?.deleteDrawing) {
              const success = await appContext.deleteDrawing(drawing.id, childId);
              if (success) {
                Alert.alert("Success", "Drawing deleted successfully.");
              } else {
                Alert.alert("Error", "Could not delete drawing. Try again.");
              }
            }
          }
        }
      ]
    );
  };

  return (
    <View 
      style={{ 
        backgroundColor: "#FFFFFF", 
        borderRadius: 20, 
        padding: 16, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#EDE9FE",
        shadowColor: "#C4A8F5",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3
      }}
    >
      {/* الجزء العلوي الثابت للكرت */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#EBF0FF", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <Ionicons name="pencil" size={24} color="#7F56D9" />
          <Text style={{ fontSize: 9, color: "#98A2B3", marginTop: 2, fontWeight: "600" }}>
            May {index + 1}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" }}>
            {drawing?.title || `Drawing #${String(index + 1).padStart(2, "0")}`}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <View style={{ backgroundColor: emStyle.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: emStyle.color, fontWeight: "600" }}>{emStyle.emoji} {safeEmotion}</Text>
            </View>
            <View style={{ backgroundColor: "#F2F4F7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: "#344054", fontWeight: "600" }}>{drawing?.confidenceLevel || 85}% confidence</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 13, color: "#667085", lineHeight: 18, marginBottom: 12, fontFamily: "Inter_400Regular" }}>
        {drawing?.summary || "A vibrant drawing full of life and color. This child is thriving and shows excellent emotional expression."}
      </Text>

      <TouchableOpacity 
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F2F4F7" }}
      >
        <Text style={{ fontSize: 13, color: "#7F56D9", fontWeight: "600", marginRight: 4 }}>
          {expanded ? "Hide analysis" : "Show analysis"}
        </Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#7F56D9" />
      </TouchableOpacity>

      {/* ── الجزء التفصيلي الذي يحتوي على الأزرار الجديدة ── */}
      {expanded && (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: "#F2F4F7", paddingTop: 16, gap: 16 }}>
          
          {/* الـ Progress Bars الملونة للعواطف */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#98A2B3", marginBottom: 10, textTransform: "uppercase" }}>
              Emotion Breakdown
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ width: 85, fontSize: 13, color: "#4A3070", fontWeight: "500" }}>Happiness</Text>
              <View style={{ flex: 1, height: 8, backgroundColor: "#EAECF0", borderRadius: 4, marginRight: 12 }}>
                <View style={{ width: `${happiness}%`, height: 8, backgroundColor: "#34D399", borderRadius: 4 }} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#34D399", width: 32, textAlign: "right" }}>{happiness}%</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ width: 85, fontSize: 13, color: "#4A3070", fontWeight: "500" }}>Anxiety</Text>
              <View style={{ flex: 1, height: 8, backgroundColor: "#EAECF0", borderRadius: 4, marginRight: 12 }}>
                <View style={{ width: `${anxiety}%`, height: 8, backgroundColor: "#FB923C", borderRadius: 4 }} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#FB923C", width: 32, textAlign: "right" }}>{anxiety}%</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ width: 85, fontSize: 13, color: "#4A3070", fontWeight: "500" }}>Sadness</Text>
              <View style={{ flex: 1, height: 8, backgroundColor: "#EAECF0", borderRadius: 4, marginRight: 12 }}>
                <View style={{ width: `${sadness}%`, height: 8, backgroundColor: "#60A5FA", borderRadius: 4 }} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#60A5FA", width: 32, textAlign: "right" }}>{sadness}%</Text>
            </View>
          </View>

          {/* صف الأزرار السفلي (عرض التحليل الكامل + زر المسح بجانبه) */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4, alignItems: "center" }}>
            
            {/* زر عرض التحليل الكامل */}
            <TouchableOpacity 
              onPress={() => router.push({ pathname: "/analysis-result", params: { drawingId: drawing.id } } as any)}
              style={{ flex: 1, backgroundColor: "#7F56D9", borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>View Full Analysis</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

          

          </View>

        </View>
      )}
    </View>
  );
}

export default function ChildAnalysisScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const appContext = useApp();
  
  useEffect(() => {
    if (appContext?.fetchDrawings && childId) {
      appContext.fetchDrawings(childId);
    }
  }, [childId, appContext]);

  if (!appContext) {
    return <View style={styles.container}><Text style={{ padding: 20 }}>Context Connection Error</Text></View>;
  }

  const { getChildDrawings, children } = appContext;
  const drawings = getChildDrawings ? getChildDrawings(childId || "") : [];
  const child = (children || []).find((c: any) => String(c.id) === String(childId));

  if (!child) {
    return <View style={styles.container}><Text style={{ padding: 20, color: "#4C1D95", textAlign: "center", marginTop: 50 }}>Loading Profile...</Text></View>;
  }

  const safeName = child?.name || "Unknown";
  const initials = child?.initials || safeName.substring(0, 2).toUpperCase() || "CH";
  const totalDrawings = drawings.length;
  const happyDrawings = drawings.filter((d: any) => d?.mainEmotion?.includes("Happ")).length;
  const happyPercentage = totalDrawings > 0 ? Math.round((happyDrawings / totalDrawings) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* ── شريط التنقل العلوي وزر الرجوع ── */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <Pressable 
          onPress={() => router.back()} 
          style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#F5F3FF", borderRadius: 12, borderWidth: 1, borderColor: "#EDE9FE" }}
        >
          <Text style={{ fontSize: 14, color: "#8B5CF6", fontWeight: "bold" }}>◀ Back</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#4C1D95" }}>Child Profile</Text>
      </View>

      {/* ── البطاقة العلوية الخاصة بالطفل ── */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: child?.avatarColor || "#6C4DFF" }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.childName}>{safeName}</Text>
        <Text style={styles.childInfo}>Age {child?.age || 0} • {child?.gender || "Not specified"}</Text>
        
        <View style={styles.activitiesRow}>
          <Text style={styles.activitiesText}>✨ {child?.favoriteActivities || "Drawing, Playing"}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalDrawings}</Text>
            <Text style={styles.statLabel}>Drawings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: "#16A34A" }]}>{happyPercentage}%</Text>
            <Text style={styles.statLabel}>Happy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: "#16A34A" }]}>High</Text>
            <Text style={styles.statLabel}>Stability</Text>
          </View>
        </View>
      </View>

      {/* ── كرت الـ AI Summary الشامل ── */}
      <Text style={styles.sectionTitle}>AI Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: "#DCFCE7" }]}>
            <Text style={[styles.badgeText, { color: "#16A34A" }]}>Mostly Happy</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "#DCFCE7" }]}>
            <Text style={[styles.badgeText, { color: "#16A34A" }]}>Stability: High</Text>
          </View>
        </View>

        <View style={styles.aiTextRow}>
          <Text style={styles.aiText}>
            🔮 {safeName} demonstrates emotions across {totalDrawings} drawings.
          </Text>
        </View>

        <Text style={styles.subSectionTitle}>EMOTIONAL DISTRIBUTION</Text>
        <View style={styles.distributionRow}>
          <Text style={styles.distLabel}>Happy</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${happyPercentage}%`, backgroundColor: "#16A34A" }]} />
          </View>
          <Text style={styles.distValue}>{happyPercentage}%</Text>
        </View>
      </View>

      {/* ── جزء قائمة رسومات الطفل بالأكورديون الجديد ── */}
      <View style={styles.drawingsHeader}>
        <Text style={styles.sectionTitle}>{safeName}'s Drawings</Text>
        <Text style={styles.totalText}>{totalDrawings} total</Text>
      </View>

      {drawings.map((d: any, index: number) => (
        <DrawingCard key={d?.id || index} drawing={d} index={index} childId={childId || ""} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { padding: 16, paddingBottom: 40 },
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
  badgesRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  aiTextRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  aiText: { flex: 1, fontSize: 14, color: "#4B5563", lineHeight: 20 },
  subSectionTitle: { fontSize: 11, fontWeight: "bold", color: "#6B7280", letterSpacing: 0.5, marginBottom: 8 },
  distributionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  distLabel: { fontSize: 13, color: "#374151", width: 45 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  distValue: { fontSize: 13, fontWeight: "600", color: "#374151" },
  drawingsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  totalText: { fontSize: 13, color: "#6B7280" },
});
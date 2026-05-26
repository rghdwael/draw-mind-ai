import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
import { useApp } from "@/context/AppContext";

export default function DrawingAnalysisScreen() {
  const insets = useSafeAreaInsets();
  
  // جلب المعرفات المرسلة في الرابط
  const { drawingId, childId: paramChildId } = useLocalSearchParams<{ drawingId: string; childId: string }>();
  
  const appContext = useApp();
  const drawings = appContext?.drawings || [];

  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  // المطابقة المرنة للرسمة
  // بدلاً من d.id، استخدمي هذا البحث المرن:
 const drawing = drawings.find((d: any) => {
  const currentId = d.id || d.drawing_id; 
  return currentId && drawingId && currentId.toString() === drawingId.toString();
 });
  // 💡 تحديد childId الذكي: إذا لم يأتي من الرابط، نأخذه فوراً من بيانات الرسمة داخل الـ Context
  const targetChildId = paramChildId || (drawing as any)?.childId || (drawing as any)?.child_id;

  // دالة زر Done للرجوع الفوري لصفحة تفاصيل الطفل الصحيحة
  function handleDone() {
    if (targetChildId) {
      router.replace({
        pathname: "/child-analysis",
        params: { childId: targetChildId }
      });
    } else {
      router.replace("/"); // حماية أخيرة للهوم
    }
  }

  async function handleDelete() {
    if (!drawingId) return;
    setLoading(true);

    try {
      // إرسال طلب الحذف الفعلي لسيرفر FastAPI ومسحه من قاعدة بيانات Neon
      const response = await fetch(`http://localhost:5000/drawings/${drawingId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("Drawing deleted successfully from Neon Console!");

        // 1. تحديث الـ Context داخلياً أولاً لتحديث الحالة
        if (appContext && 'deleteDrawing' in appContext) {
          await (appContext as any).deleteDrawing(drawingId);
        }

        // 2. 🚀 الطيران الفوري لصفحة تفاصيل الطفل المحددة بناءً على المعرف الذكي
        if (targetChildId) {
          router.replace({
            pathname: "/child-analysis",
            params: { childId: targetChildId }
          });
        } else {
          router.replace("/");
        }
      } else {
        alert(data.detail || "Failed to delete drawing.");
      }
    } catch (error) {
      console.error("Error deleting drawing:", error);
      alert("Connection error while deleting.");
    } finally {
      setLoading(false);
    }
  }

  // حماية الخروج الصامت لمنع الشاشات البيضاء أو أخطاء الـ 404 المؤقتة
  if (!drawing) {
    if (Platform.OS === "web") {
      if (targetChildId) {
        router.replace({
          pathname: "/child-analysis",
          params: { childId: targetChildId }
        });
      } else {
        router.replace("/");
      }
    }
    return null;
  }

  const drawingPath = (drawing as any).image_path || (drawing as any).imageUrl || "";
  const imageUri = drawingPath
    ? (drawingPath.startsWith("http") ? drawingPath : `http://localhost:5000${drawingPath}`)
    : "https://via.placeholder.com/150";

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      {/* NavBar بدون سهم العودة العلوي */}
      <View style={styles.navBar}>
        <View style={{ width: 24 }} />
        <Text style={styles.navTitle}>Drawing Analysis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Drawing Preview Card */}
        <View style={styles.previewCard}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.drawingImage} 
            resizeMode="contain" 
          />
          <Text style={styles.drawingTitle}>{(drawing as any).summary || "Child's Drawing"}</Text>
          <Text style={styles.drawingDate}>{(drawing as any).date || "2026-05-20"}</Text>
        </View>

        {/* Detected Emotion Banner */}
        <View style={styles.emotionBanner}>
          <Text style={styles.emotionLabel}>DETECTED EMOTION</Text>
          <Text style={styles.emotionValue}>{(drawing as any).mainEmotion || "Happiness"}</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>✨ {(drawing as any).confidenceLevel || 92}% confidence</Text>
          </View>
        </View>

        {/* AI Summary Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={16} color="#A78BFA" />
            <Text style={styles.cardHeading}>AI Summary</Text>
          </View>
          <Text style={styles.arabicText}>تشير هذه الرسمة إلى شعور الطفل بالسعادة والاستقرار والبهجة.</Text>
        </View>

        {/* Behavioral Insights */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics-outline" size={16} color="#A78BFA" />
            <Text style={styles.cardHeading}>Behavioral Insights</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="heart-outline" size={18} color="#FF6B9D" />
            <View style={styles.insightTextContainer}>
              <Text style={styles.insightTitle}>Emotional State</Text>
              <Text style={styles.insightSub}>Excellent emotional stability and positivity</Text>
            </View>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="people-outline" size={18} color="#48CAE4" />
            <View style={styles.insightTextContainer}>
              <Text style={styles.insightTitle}>Social Indicators</Text>
              <Text style={styles.insightSub}>Very socially engaged and connected</Text>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="ribbon-outline" size={16} color="#A78BFA" />
            <Text style={styles.cardHeading}>Recommendations</Text>
          </View>
          <Text style={styles.insightSub}>✓ Encourage your child to continue drawing to further express positive feelings.</Text>
        </View>

        {/* شريط الأزرار السفلي الثنائي المتناسق */}
        <View style={styles.btnRow}>
          <TouchableOpacity onPress={handleDone} style={styles.doneBtn}>
            <LinearGradient colors={["#C4A8F5", "#A78BFA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} disabled={loading} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>{loading ? "Deleting..." : "Delete Drawing"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#4A3070", textAlign: "center", flex: 1, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  previewCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 16, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#EAD4F5" },
  drawingImage: { width: "100%", height: 200, borderRadius: 16, marginBottom: 12 },
  drawingTitle: { fontSize: 15, fontWeight: "700", color: "#4A3070", marginBottom: 4 },
  drawingDate: { fontSize: 12, color: "#A090B8" },
  emotionBanner: { backgroundColor: "#FFB5D0", borderRadius: 24, padding: 20, alignItems: "center", marginBottom: 16 },
  emotionLabel: { fontSize: 11, fontWeight: "700", color: "#FFFFFF", letterSpacing: 1, marginBottom: 4 },
  emotionValue: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", marginBottom: 8 },
  confidenceBadge: { backgroundColor: "rgba(255,255,255,0.3)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  confidenceText: { fontSize: 12, color: "#FFFFFF", fontWeight: "600" },
  infoCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#EAD4F5" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cardHeading: { fontSize: 14, fontWeight: "700", color: "#4A3070" },
  arabicText: { fontSize: 14, color: "#7A6090", textAlign: "right", lineHeight: 22 },
  insightItem: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 10 },
  insightTextContainer: { flex: 1 },
  insightTitle: { fontSize: 13, fontWeight: "700", color: "#4A3070" },
  insightSub: { fontSize: 13, color: "#7A6090", marginTop: 2, flexWrap: "wrap" },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 12, width: "100%" },
  doneBtn: { flex: 0.5, height: 50, borderRadius: 25, overflow: "hidden" },
  gradientBtn: { flex: 1, alignItems: "center", justifyContent: "center" },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  deleteBtn: { flex: 0.5, height: 50, borderRadius: 25, backgroundColor: "#FFE5EC", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FFB5D0" },
  deleteBtnText: { fontSize: 15, fontWeight: "700", color: "#FF6B9D" },
});
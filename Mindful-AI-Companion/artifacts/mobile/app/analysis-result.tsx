import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
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
  
  // 1. Fetch params from router
  const { drawingId, childId: paramChildId, freshAnalysis, freshImage } = useLocalSearchParams<any>();
  
  const appContext = useApp();
  const drawings = appContext?.drawings || [];
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  // 2. Find the drawing in context
  const drawing = drawings.find((d: any) => {
    const currentId = d.id || d.drawing_id; 
    return currentId && drawingId && currentId.toString() === drawingId.toString();
  });
  
const [safeChildId] = useState(paramChildId || (drawing as any)?.childId || (drawing as any)?.child_id);
  // 3. Unpack the JSON safely from the router
  let parsedAnalysis = null;
  try {
    if (freshAnalysis) {
      parsedAnalysis = JSON.parse(freshAnalysis);
      
      // 🚨 FIX: If Groq double-wrapped the JSON in quotes, parse it one more time!
      if (typeof parsedAnalysis === "string") {
        parsedAnalysis = JSON.parse(parsedAnalysis);
      }
    }
  } catch (e) {
    console.error("Failed to parse injected analysis", e);
  }

  // 🚨 4. CREATE THE SINGLE TRUTH SOURCE
  const activeAnalysis = parsedAnalysis || (drawing as any)?.analysis;
  
  // Set up the Image
  const drawingPath = freshImage || (drawing as any)?.image_path || (drawing as any)?.imageUrl || "";
  const imageUri = drawingPath
    ? (drawingPath.startsWith("http") ? drawingPath : `http://127.0.0.1:8000${drawingPath}`)
    : "https://via.placeholder.com/150";

  // Handlers
  function handleDone() {
    if (safeChildId) {
      router.replace({
        pathname: "/child-analysis",
        params: { childId: safeChildId }
      });
    } else {
      router.replace("/");
    }
  }

  async function handleDelete() {
    if (!drawingId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/drawings/${drawingId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok && data.success) {
        console.log("Drawing deleted successfully!");
        if (appContext && 'deleteDrawing' in appContext) {
          await (appContext as any).deleteDrawing(drawingId);
        }
        if (safeChildId) {
          router.replace({
            pathname: "/child-analysis",
            params: { childId: safeChildId }
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

  // Silent fallback if no data
  useEffect(() => {
    if (!drawing && !activeAnalysis) {
      if (Platform.OS === "web") {
        if (safeChildId) {
          router.replace({ pathname: "/child-analysis", params: { childId: safeChildId } });
        } else {
          router.replace("/");
        }
      }
    }
  }, [drawing, activeAnalysis, safeChildId]);

  if (!drawing && !activeAnalysis) {
    return null; // Prevents the broken UI from rendering while it redirects
  }

  return (
    <View style={styles.container}>
      {/* NavBar with Back Button */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }}
        >
          <Ionicons name="chevron-back" size={26} color="#4A3070" />
        </TouchableOpacity>
        
        <Text style={styles.navTitle}>Drawing Analysis</Text>
        
        <View style={{ width: 40 }} /> {/* Balances the header */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Drawing Preview Card */}
        <View style={styles.previewCard}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.drawingImage} 
            resizeMode="contain" 
          />
          <Text style={styles.drawingDate}>{(drawing as any)?.date || new Date().toISOString().split('T')[0]}</Text>
        </View>

        {/* Detected Emotion Banner */}
        <View style={styles.emotionBanner}>
          <Text style={styles.emotionLabel}>DETECTED EMOTION</Text>
          <Text style={[styles.emotionValue, { fontSize: 22, textAlign: 'center' }]}>
            {activeAnalysis?.emotional_status || "Analysis pending"}
          </Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              ✨ {activeAnalysis?.confidence_level || "Analyzing..."} confidence
            </Text>
          </View>
        </View>

        {/* AI Summary Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={16} color="#A78BFA" />
            <Text style={styles.cardHeading}>AI Summary</Text>
          </View>
          <Text style={[styles.arabicText, { textAlign: "left" }]}>
            {activeAnalysis?.explanation || "AI analysis is generating..."}
          </Text>
          
          {activeAnalysis?.what_model_focused_on && (
            <Text style={[styles.arabicText, { textAlign: "left", marginTop: 12, fontStyle: "italic", color: "#A78BFA" }]}>
              🔍 Model Focus: {activeAnalysis.what_model_focused_on}
            </Text>
          )}
        </View>

        {/* Behavioral Insights */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics-outline" size={16} color="#A78BFA" />
            <Text style={styles.cardHeading}>Behavioral Insights</Text>
          </View>

          {activeAnalysis?.positive_signs?.map((sign: string, index: number) => (
            <View style={styles.insightItem} key={`pos-${index}`}>
              <Ionicons name="heart-outline" size={18} color="#FF6B9D" />
              <View style={styles.insightTextContainer}>
                <Text style={styles.insightTitle}>Positive Indicator</Text>
                <Text style={[styles.insightSub, { textAlign: "left" }]}>{sign}</Text>
              </View>
            </View>
          ))}

          {activeAnalysis?.concern_signs?.map((sign: string, index: number) => (
            <View style={styles.insightItem} key={`con-${index}`}>
              <Ionicons name="warning-outline" size={18} color="#F5A623" />
              <View style={styles.insightTextContainer}>
                <Text style={styles.insightTitle}>Area of Concern</Text>
                <Text style={[styles.insightSub, { textAlign: "left" }]}>{sign}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="ribbon-outline" size={16} color="#A78BFA" />
            <Text style={styles.cardHeading}>Recommendations</Text>
          </View>
          
          {activeAnalysis?.suggestions?.map((suggestion: string, index: number) => (
            <Text style={[styles.insightSub, { textAlign: "left", marginBottom: 6 }]} key={`sug-${index}`}>
              ✓ {suggestion}
            </Text>
          )) || <Text style={styles.insightSub}>Generating recommendations...</Text>}

          {activeAnalysis?.professional_note && (
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#EAD4F5" }}>
              <Text style={[styles.insightSub, { textAlign: "left", fontWeight: "600", color: "#4A3070" }]}>
                Professional Note:
              </Text>
              <Text style={[styles.insightSub, { textAlign: "left" }]}>
                {activeAnalysis.professional_note}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Buttons */}
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
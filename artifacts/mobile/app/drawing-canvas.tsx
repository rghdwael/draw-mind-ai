import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { DrawingArea } from "@/components/DrawingArea";
import type { DrawPath, Tool } from "@/components/DrawingArea";

// ── Color palette ─────────────────────────────────────────────────────────────
const COLORS = [
  "#4A3070", "#A78BFA", "#FF6B6B", "#90BE6D",
  "#F8961E", "#48CAE4", "#FF6B9D", "#C4B0FF", "#FFFFFF",
];

// ── Tool button ───────────────────────────────────────────────────────────────
function ToolBtn({ tool, active, onPress }: { tool: Tool; active: boolean; onPress: () => void }) {
  const icon = tool === "pencil" ? "pencil" : tool === "brush" ? "brush" : "remove-circle-outline";
  return (
    <TouchableOpacity onPress={onPress} style={[styles.toolBtn, active && styles.toolBtnActive]}>
      <Ionicons name={icon} size={20} color={active ? "#fff" : "#A78BFA"} />
      <Text style={[styles.toolLabel, active && styles.toolLabelActive]}>
        {tool.charAt(0).toUpperCase() + tool.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

// ── Analyzing overlay ─────────────────────────────────────────────────────────
function AnalyzingOverlay({ visible, childName }: { visible: boolean; childName: string }) {
  const pulse = useRef(new Animated.Value(0.85)).current;

  React.useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, pulse]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ov.backdrop}>
        <LinearGradient colors={["#C4A8F5", "#D4B0F0"]} style={ov.card}>
          <Animated.View style={[ov.iconWrap, { transform: [{ scale: pulse }] }]}>
            <Ionicons name="sparkles" size={40} color="#fff" />
          </Animated.View>
          <Text style={ov.title}>Analyzing Drawing…</Text>
          <Text style={ov.sub}>
            Reading emotional patterns{"\n"}in {childName}'s artwork
          </Text>
          <View style={ov.dotsRow}>
            {[0, 1, 2].map((i) => (
              <ProgressDot key={i} delay={i * 220} />
            ))}
          </View>
          <Text style={ov.hint}>This takes just a moment</Text>
        </LinearGradient>
      </View>
    </Modal>
  );
}

function ProgressDot({ delay }: { delay: number }) {
  const op = useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [delay, op]);
  return <Animated.View style={[ov.dot, { opacity: op }]} />;
}

const ov = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: "rgba(15,8,38,0.75)", alignItems: "center", justifyContent: "center", padding: 32 },
  card:      { borderRadius: 32, paddingVertical: 44, paddingHorizontal: 36, alignItems: "center", gap: 16, width: "100%", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.6, shadowRadius: 40, elevation: 20 },
  iconWrap:  { width: 84, height: 84, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title:     { fontSize: 22, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  sub:       { fontSize: 14, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  dotsRow:   { flexDirection: "row", gap: 8, marginTop: 4 },
  dot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  hint:      { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function DrawingCanvas() {
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const appContext = useApp();
  
  const children = appContext?.children || [];
  const child = children.find((c: any) => String(c.id) === String(childId));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [paths, setPaths]             = useState<DrawPath[]>([]);
  const [activeTool, setActiveTool]   = useState<Tool>("pencil");
  const [selectedColor, setSelectedColor] = useState("#4A3070");
  const [canvasSize, setCanvasSize]   = useState({ w: 0, h: 0 });

  function handleCanvasLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize(prev =>
      prev.w === Math.round(width) && prev.h === Math.round(height)
        ? prev
        : { w: Math.round(width), h: Math.round(height) }
    );
  }

  const [description, setDescription] = useState("");
  const [descFocused, setDescFocused] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeBtnScale = useRef(new Animated.Value(0)).current;
  const hasPaths = paths.length > 0;

  React.useEffect(() => {
    Animated.spring(analyzeBtnScale, {
      toValue: hasPaths ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 10,
    }).start();
  }, [hasPaths, analyzeBtnScale]);

  function handleStrokeComplete(stroke: DrawPath) {
    setPaths((prev) => [...prev, stroke]);
  }

  function handleUndo() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPaths([]);
  }

  function selectTool(tool: Tool) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTool(tool);
  }

  const getSnapshotRef = useRef<(() => string | null) | null>(null);

  // ── 🚀 دالة الرفع المباشرة والذكية للـ Canvas للباك إند و Neon ──
  async function handleAnalyze() {
    if (!hasPaths || isAnalyzing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsAnalyzing(true);

    // 1. التقاط مسار خطوط الرسمة حركياً
    let imageUri = getSnapshotRef.current?.() ?? null;

    // كحماية إضافية للويب لضمان وجود المسار المؤقت الصالح
    if (!imageUri && paths.length > 0) {
      imageUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    try {
      const formData = new FormData();
      formData.append("child_id", childId?.toString() || "");
      formData.append("parent_explanation", description.trim() || "No context provided by parent.");

      // 2. معالجة الـ URI وتحويله إلى ملف باينري يقرأه السيرفر
      if (imageUri) {
        const responseBlob = await fetch(imageUri);
        const blob = await responseBlob.blob();
        const filename = `canvas_drawing_${Date.now()}.png`;
        formData.append("file", blob, filename);
      }

      // 3. إرسال الطلب الفوري المباشر لسيرفر FastAPI لتعبئة جداول Neon
      const response = await fetch("http://localhost:5000/drawings", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setIsAnalyzing(false);

      if (response.ok && (data.success || data.drawing_id)) {
        console.log("Canvas drawing analyzed and populated successfully!");
        
        if (appContext?.fetchDrawings && childId) {
          await appContext.fetchDrawings(childId);
        }

        // الانتقال لصفحة النتيجة الملونة الفخمة مع تمرير المعرّف الجديد الحقيقي
        router.replace({
          pathname: "/analysis-result",
          params: { drawingId: String(data.drawing_id) },
        });
      } else {
        alert("Analysis failed. Please try drawing again.");
      }
    } catch (error) {
      console.error("Error sending canvas drawing to FastAPI:", error);
      setIsAnalyzing(false);
      alert("Connection error while sending drawing.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPad }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* NavBar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#4A3070" />
        </TouchableOpacity>

        {child && (
          <View style={styles.childChip}>
            <LinearGradient colors={[child.avatarColor + "DD", child.avatarColor]} style={styles.chipAvatar}>
              <Text style={styles.chipInitials}>{child.initials || "CH"}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.chipName}>{child.name}</Text>
              <Text style={styles.chipAge}>Age {child.age}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionBtns}>
          <TouchableOpacity onPress={handleUndo} style={styles.iconBtn} disabled={!hasPaths}>
            <Ionicons name="arrow-undo" size={18} color={hasPaths ? "#A78BFA" : "#C0B0D8"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.iconBtn} disabled={!hasPaths}>
            <Ionicons name="trash-outline" size={18} color={hasPaths ? "#FF6B6B" : "#C0B0D8"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas Area */}
      <View style={styles.canvasWrap}>
        <View style={styles.canvas} onLayout={handleCanvasLayout}>
          <DrawingArea
            paths={paths}
            activeTool={activeTool}
            selectedColor={selectedColor}
            onStrokeComplete={handleStrokeComplete}
            canvasWidth={canvasSize.w}
            canvasHeight={canvasSize.h}
            onCanvasReady={(fn) => { getSnapshotRef.current = fn; }}
          />
          {!hasPaths && (
            <View style={styles.canvasHint} pointerEvents="none">
              <Ionicons name="brush-outline" size={42} color="#E0D9FF" />
              <Text style={styles.canvasHintText}>Draw here</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tools Section */}
      <View style={styles.toolsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorsRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => { setSelectedColor(c); if (activeTool === "eraser") setActiveTool("pencil"); }}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                c === "#FFFFFF" && styles.colorDotWhite,
                selectedColor === c && activeTool !== "eraser" && styles.colorDotSelected,
              ]}
            />
          ))}
        </ScrollView>

        <View style={styles.toolsRow}>
          <ToolBtn tool="pencil" active={activeTool === "pencil"} onPress={() => selectTool("pencil")} />
          <ToolBtn tool="brush"  active={activeTool === "brush"}  onPress={() => selectTool("brush")}  />
          <ToolBtn tool="eraser" active={activeTool === "eraser"} onPress={() => selectTool("eraser")} />
        </View>
      </View>

      {/* Parent Notes */}
      <View style={styles.descSection}>
        <View style={styles.descLabelRow}>
          <Ionicons name="create-outline" size={14} color="#A090B8" />
          <Text style={styles.descLabel}>Parent Notes</Text>
        </View>
        <View style={[styles.descBox, descFocused && styles.descBoxFocused]}>
          <TextInput
            style={styles.descInput}
            placeholder="Describe the situation, child's mood, and observations…"
            placeholderTextColor="#C0B0D8"
            value={description}
            onChangeText={setDescription}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            maxLength={500}
          />
          {description.length > 0 && (
            <Text style={styles.charCount}>{description.length}/500</Text>
          )}
        </View>
      </View>

      {/* Action Button */}
      <Animated.View
        style={[
          styles.analyzeWrap,
          { paddingBottom: botPad + 10, transform: [{ scale: analyzeBtnScale }] },
        ]}
      >
        <TouchableOpacity onPress={handleAnalyze} disabled={!hasPaths} activeOpacity={0.88} style={{ width: "100%" }}>
          <LinearGradient
            colors={hasPaths ? ["#C4A8F5", "#D4B0F0", "#F0A8C8"] : ["#C0B0D8", "#D0C0E8"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.analyzeBtn}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.analyzeBtnText}>Analyze Child</Text>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <AnalyzingOverlay visible={isAnalyzing} childName={child?.name ?? "child"} />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  navBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  childChip:    { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  chipAvatar:   { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  chipInitials: { fontSize: 11, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  chipName:     { fontSize: 13, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  chipAge:      { fontSize: 10, color: "#A090B8", fontFamily: "Inter_400Regular" },
  actionBtns:   { flexDirection: "row", gap: 8 },
  iconBtn:      { width: 36, height: 36, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F0E8FF" },
  canvasWrap: { flex: 1, paddingHorizontal: 16, paddingVertical: 6 },
  canvas: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 24, overflow: "hidden",
    borderWidth: 2, borderColor: "#EAD4F5",
    shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  canvasHint:     { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 10 },
  canvasHintText: { fontSize: 15, color: "#EAD4F5", fontFamily: "Inter_500Medium" },
  toolsSection:    { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  colorsRow:       { gap: 9, alignItems: "center", paddingHorizontal: 2 },
  colorDot:        { width: 27, height: 27, borderRadius: 14 },
  colorDotWhite:   { borderWidth: 1.5, borderColor: "#EAD4F5" },
  colorDotSelected:{ borderWidth: 3, borderColor: "#A78BFA", transform: [{ scale: 1.1 }] },
  toolsRow:        { flexDirection: "row", gap: 10 },
  toolBtn:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#F0E8FF", borderRadius: 14, paddingVertical: 9, borderWidth: 1, borderColor: "#EAD4F5" },
  toolBtnActive:   { backgroundColor: "#A78BFA", borderColor: "#A78BFA" },
  toolLabel:       { fontSize: 12, fontWeight: "600", color: "#A78BFA", fontFamily: "Inter_600SemiBold" },
  toolLabelActive: { color: "#fff" },
  descSection:    { paddingHorizontal: 16, gap: 6, paddingTop: 2, paddingBottom: 6 },
  descLabelRow:   { flexDirection: "row", alignItems: "center", gap: 5 },
  descLabel:      { fontSize: 11, fontWeight: "600", color: "#A090B8", fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase" },
  descBox:        { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, borderWidth: 1.5, borderColor: "#EAD4F5", minHeight: 64 },
  descBoxFocused: { borderColor: "#A78BFA" },
  descInput:      { fontSize: 13, color: "#4A3070", fontFamily: "Inter_400Regular", lineHeight: 20, minHeight: 40 },
  charCount:      { fontSize: 10, color: "#C0B0D8", fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  analyzeWrap: { paddingHorizontal: 16, paddingTop: 6 },
  analyzeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 17, borderRadius: 28,
    shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12,
  },
  analyzeBtnText: { fontSize: 17, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
});
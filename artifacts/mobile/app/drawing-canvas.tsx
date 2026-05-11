import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { EmotionScore } from "@/context/AppContext";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Point    { x: number; y: number }
interface DrawPath { points: Point[]; color: string; width: number; isEraser: boolean }
type Tool = "pencil" | "brush" | "eraser";

function pointsToSvgD(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  return d;
}

// ── Color palette ─────────────────────────────────────────────────────────────
const COLORS = [
  "#1A0F2E", "#6C4DFF", "#FF6B6B", "#90BE6D",
  "#F8961E", "#48CAE4", "#FF6B9D", "#9B7FFF", "#FFFFFF",
];

// ── Mock AI analysis ──────────────────────────────────────────────────────────
const EMOTIONS = ["Happy", "Sad", "Angry", "Anxiety", "Fear"] as const;
const EMOTION_COLORS: Record<string, string> = {
  Happy: "#90BE6D", Sad: "#577590", Angry: "#F3722C", Anxiety: "#F8961E", Fear: "#9B7FFF",
};

function generateMockAnalysis(description: string, pathCount: number) {
  const seed       = (description.length + pathCount * 7 + Date.now() % 200) % 100;
  const mainIdx    = seed % EMOTIONS.length;
  const emotion    = EMOTIONS[mainIdx];
  const confidence = 65 + (seed % 30);

  const emotions: EmotionScore[] = EMOTIONS.map((name, i) => ({
    name,
    percentage: name === emotion ? confidence : Math.min(10 + ((seed * (i + 3)) % 35), 99),
    color: EMOTION_COLORS[name],
  })).sort((a, b) => b.percentage - a.percentage);

  const summaries: Record<string, string> = {
    Happy:   "This drawing suggests emotional comfort, creativity, and positive social feelings. The child appears to be in a secure and nurturing environment.",
    Sad:     "This drawing indicates underlying sadness. The child may be processing a recent emotional experience through creative expression.",
    Angry:   "Bold strokes and intense choices suggest the child is working through feelings of frustration. Art is a healthy outlet for these emotions.",
    Anxiety: "There are indicators of mild anxiety in this drawing. The child may be experiencing some worry or uncertainty about their environment.",
    Fear:    "The drawing reflects some fearful emotions. A calm, safe environment and open dialogue will help the child feel supported.",
  };

  const states: Record<string, string> = {
    Happy:   "Positive and stable emotional baseline with high energy",
    Sad:     "Processing some sadness; additional warmth and support may help",
    Angry:   "Processing frustration in a healthy way through creative expression",
    Anxiety: "Mild anxious energy; benefit from reassurance routines",
    Fear:    "Fearful emotional state; safe space and dialogue recommended",
  };

  const recs: Record<string, string[]> = {
    Happy:   ["Encourage outdoor play and exploration", "Maintain positive reinforcement strategies", "Continue creative activities to boost expression"],
    Sad:     ["Create open conversations about feelings", "Schedule more play dates and social activities", "Offer comfort activities like drawing or reading together"],
    Angry:   ["Teach emotional regulation techniques", "Identify and address sources of frustration", "Practice calming exercises together daily"],
    Anxiety: ["Establish consistent routines to reduce uncertainty", "Practice breathing exercises together", "Provide reassurance before new situations"],
    Fear:    ["Create a safe, predictable environment", "Gently explore what the child is afraid of", "Use play to build confidence around feared situations"],
  };

  return {
    mainEmotion:      emotion,
    confidence,
    emotions,
    summary:          summaries[emotion],
    emotionalState:   states[emotion],
    socialIndicators: confidence > 80 ? "Strong peer connections, feels included and valued" : "Some social withdrawal noted; encourage group activities",
    stressSignals:    confidence > 75 ? "Minimal stress indicators present" : "Moderate stress indicators — monitor closely",
    creativityLevel:  58 + (seed % 40),
    confidenceLevel:  54 + (seed % 42),
    recommendations:  recs[emotion],
  };
}

// ── Tool button ───────────────────────────────────────────────────────────────
function ToolBtn({ tool, active, onPress }: { tool: Tool; active: boolean; onPress: () => void }) {
  const icon = tool === "pencil" ? "pencil" : tool === "brush" ? "brush" : "remove-circle-outline";
  return (
    <TouchableOpacity onPress={onPress} style={[styles.toolBtn, active && styles.toolBtnActive]}>
      <Ionicons name={icon} size={20} color={active ? "#fff" : "#6C4DFF"} />
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
        <LinearGradient colors={["#2D1B8E", "#6C4DFF"]} style={ov.card}>
          {/* Pulsing brain icon */}
          <Animated.View style={[ov.iconWrap, { transform: [{ scale: pulse }] }]}>
            <Ionicons name="sparkles" size={40} color="#fff" />
          </Animated.View>

          <Text style={ov.title}>Analyzing Drawing…</Text>
          <Text style={ov.sub}>
            Reading emotional patterns{"\n"}in {childName}'s artwork
          </Text>

          {/* Progress dots */}
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
  card:      { borderRadius: 32, paddingVertical: 44, paddingHorizontal: 36, alignItems: "center", gap: 16, width: "100%", shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.6, shadowRadius: 40, elevation: 20 },
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
  const { children, addDrawing } = useApp();
  const child = children.find((c) => c.id === childId);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Drawing state
  const [paths, setPaths]                   = useState<DrawPath[]>([]);
  const [currentPathPoints, setCurrentPath] = useState<Point[]>([]);
  const currentPointsRef                    = useRef<Point[]>([]);
  const [activeTool, setActiveTool]         = useState<Tool>("pencil");
  const [selectedColor, setSelectedColor]   = useState("#1A0F2E");

  // Parent notes
  const [description, setDescription] = useState("");
  const [descFocused, setDescFocused] = useState(false);

  // Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze button entrance animation
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

  const brushWidth  = activeTool === "brush" ? 10 : activeTool === "eraser" ? 24 : 4;
  const strokeColor = activeTool === "eraser" ? "#FFFFFF" : selectedColor;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (evt) => {
      const pt = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
      currentPointsRef.current = [pt];
      setCurrentPath([pt]);
    },
    onPanResponderMove: (evt) => {
      const pt = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
      currentPointsRef.current = [...currentPointsRef.current, pt];
      setCurrentPath([...currentPointsRef.current]);
    },
    onPanResponderRelease: () => {
      if (currentPointsRef.current.length > 0) {
        setPaths((prev) => [
          ...prev,
          { points: [...currentPointsRef.current], color: strokeColor, width: brushWidth, isEraser: activeTool === "eraser" },
        ]);
        currentPointsRef.current = [];
        setCurrentPath([]);
      }
    },
  });

  function handleUndo() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPaths([]);
    setCurrentPath([]);
  }

  function selectTool(tool: Tool) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTool(tool);
  }

  async function handleAnalyze() {
    if (!hasPaths || isAnalyzing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsAnalyzing(true);

    // Simulate AI processing time
    await new Promise((r) => setTimeout(r, 2400));

    const analysis   = generateMockAnalysis(description, paths.length);
    const pathsJson  = JSON.stringify(paths);

    await addDrawing({
      childId: childId ?? "",
      pathsJson,
      ...analysis,
    });

    setIsAnalyzing(false);

    // Navigate to the child's profile so they can see the saved result
    router.replace({
      pathname: "/child-analysis",
      params: { childId: childId ?? "" },
    });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPad }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Nav bar ── */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1A0F2E" />
        </TouchableOpacity>

        {child && (
          <View style={styles.childChip}>
            <LinearGradient colors={[child.avatarColor + "DD", child.avatarColor]} style={styles.chipAvatar}>
              <Text style={styles.chipInitials}>{child.initials}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.chipName}>{child.name}</Text>
              <Text style={styles.chipAge}>Age {child.age}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionBtns}>
          <TouchableOpacity onPress={handleUndo} style={styles.iconBtn} disabled={!hasPaths}>
            <Ionicons name="arrow-undo" size={18} color={hasPaths ? "#6C4DFF" : "#C0B0D8"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.iconBtn} disabled={!hasPaths}>
            <Ionicons name="trash-outline" size={18} color={hasPaths ? "#FF6B6B" : "#C0B0D8"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Canvas ── */}
      <View style={styles.canvasWrap}>
        <View style={styles.canvas} {...panResponder.panHandlers}>
          <Svg style={StyleSheet.absoluteFill}>
            {paths.map((p, idx) => (
              <Path
                key={idx}
                d={pointsToSvgD(p.points)}
                stroke={p.color}
                strokeWidth={p.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPathPoints.length > 0 && (
              <Path
                d={pointsToSvgD(currentPathPoints)}
                stroke={strokeColor}
                strokeWidth={brushWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
          {!hasPaths && currentPathPoints.length === 0 && (
            <View style={styles.canvasHint} pointerEvents="none">
              <Ionicons name="brush-outline" size={42} color="#E0D9FF" />
              <Text style={styles.canvasHintText}>Draw here</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Tools ── */}
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

      {/* ── Parent Notes ── */}
      <View style={styles.descSection}>
        <View style={styles.descLabelRow}>
          <Ionicons name="create-outline" size={14} color="#8B7BAB" />
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

      {/* ── Analyze Child button ── */}
      <Animated.View
        style={[
          styles.analyzeWrap,
          { paddingBottom: botPad + 10, transform: [{ scale: analyzeBtnScale }] },
        ]}
      >
        <TouchableOpacity onPress={handleAnalyze} disabled={!hasPaths} activeOpacity={0.88} style={{ width: "100%" }}>
          <LinearGradient
            colors={hasPaths ? ["#4A30E0", "#6C4DFF", "#9B7FFF"] : ["#C0B0D8", "#D0C0E8"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.analyzeBtn}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.analyzeBtnText}>Analyze Child</Text>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Analyzing modal ── */}
      <AnalyzingOverlay visible={isAnalyzing} childName={child?.name ?? "child"} />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F1FF" },

  /* Nav */
  navBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  childChip:    { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  chipAvatar:   { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  chipInitials: { fontSize: 11, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  chipName:     { fontSize: 13, fontWeight: "700", color: "#1A0F2E", fontFamily: "Inter_700Bold" },
  chipAge:      { fontSize: 10, color: "#8B7BAB", fontFamily: "Inter_400Regular" },
  actionBtns:   { flexDirection: "row", gap: 8 },
  iconBtn:      { width: 36, height: 36, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#EDE9FF" },

  /* Canvas */
  canvasWrap: { flex: 1, paddingHorizontal: 16, paddingVertical: 6 },
  canvas: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 24, overflow: "hidden",
    borderWidth: 2, borderColor: "#DDD6FF",
    shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  canvasHint:     { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 10 },
  canvasHintText: { fontSize: 15, color: "#DDD6FF", fontFamily: "Inter_500Medium" },

  /* Tools */
  toolsSection:    { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  colorsRow:       { gap: 9, alignItems: "center", paddingHorizontal: 2 },
  colorDot:        { width: 27, height: 27, borderRadius: 14 },
  colorDotWhite:   { borderWidth: 1.5, borderColor: "#DDD6FF" },
  colorDotSelected:{ borderWidth: 3, borderColor: "#6C4DFF", transform: [{ scale: 1.1 }] },
  toolsRow:        { flexDirection: "row", gap: 10 },
  toolBtn:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EDE9FF", borderRadius: 14, paddingVertical: 9, borderWidth: 1, borderColor: "#DDD6FF" },
  toolBtnActive:   { backgroundColor: "#6C4DFF", borderColor: "#6C4DFF" },
  toolLabel:       { fontSize: 12, fontWeight: "600", color: "#6C4DFF", fontFamily: "Inter_600SemiBold" },
  toolLabelActive: { color: "#fff" },

  /* Description */
  descSection:    { paddingHorizontal: 16, gap: 6, paddingTop: 2, paddingBottom: 6 },
  descLabelRow:   { flexDirection: "row", alignItems: "center", gap: 5 },
  descLabel:      { fontSize: 11, fontWeight: "600", color: "#8B7BAB", fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase" },
  descBox:        { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, borderWidth: 1.5, borderColor: "#DDD6FF", minHeight: 64 },
  descBoxFocused: { borderColor: "#6C4DFF" },
  descInput:      { fontSize: 13, color: "#1A0F2E", fontFamily: "Inter_400Regular", lineHeight: 20, minHeight: 40 },
  charCount:      { fontSize: 10, color: "#C0B0D8", fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },

  /* Analyze */
  analyzeWrap: { paddingHorizontal: 16, paddingTop: 6 },
  analyzeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 17, borderRadius: 28,
    shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12,
  },
  analyzeBtnText: { fontSize: 17, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
});

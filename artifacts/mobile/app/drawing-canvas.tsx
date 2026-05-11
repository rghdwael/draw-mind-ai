import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChildAvatar } from "@/components/ChildAvatar";
import { useApp } from "@/context/AppContext";
import type { EmotionScore, Drawing } from "@/context/AppContext";

interface Point {
  x: number;
  y: number;
}

interface DrawPath {
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
}

function pointsToSvgD(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

const COLORS = [
  "#1A0F2E",
  "#6C4DFF",
  "#FF6B6B",
  "#90BE6D",
  "#F8961E",
  "#48CAE4",
  "#FF6B9D",
  "#9B7FFF",
  "#FFFFFF",
];

type Tool = "pencil" | "brush" | "eraser";

function generateMockAnalysis(): Omit<Drawing, "id" | "date" | "childId" | "pathsJson"> {
  const templates = [
    {
      mainEmotion: "Happy",
      confidence: 92,
      emotions: [
        { name: "Happiness", percentage: 92, color: "#90BE6D" },
        { name: "Anxiety", percentage: 18, color: "#F8961E" },
        { name: "Sadness", percentage: 11, color: "#577590" },
        { name: "Anger", percentage: 5, color: "#F3722C" },
      ] as EmotionScore[],
      summary:
        "This drawing suggests emotional comfort, creativity, and positive social feelings. The child appears to be in a secure and nurturing environment.",
      emotionalState: "Positive and stable emotional baseline with high energy",
      socialIndicators: "Strong peer connections, feels included and valued",
      stressSignals: "Minimal stress indicators present",
      creativityLevel: 88,
      confidenceLevel: 79,
      recommendations: [
        "Encourage outdoor play and exploration",
        "Maintain positive reinforcement strategies",
        "Continue creative activities to boost expression",
      ],
    },
    {
      mainEmotion: "Calm",
      confidence: 84,
      emotions: [
        { name: "Happiness", percentage: 78, color: "#90BE6D" },
        { name: "Anxiety", percentage: 22, color: "#F8961E" },
        { name: "Sadness", percentage: 15, color: "#577590" },
        { name: "Excitement", percentage: 45, color: "#B89CFF" },
      ] as EmotionScore[],
      summary:
        "A calm and centered drawing reflecting inner peace. The child shows healthy emotional regulation and is processing their world constructively.",
      emotionalState: "Calm, centered, emotionally regulated",
      socialIndicators: "Comfortable with relationships, open to connection",
      stressSignals: "Low stress levels — child feels safe",
      creativityLevel: 75,
      confidenceLevel: 82,
      recommendations: [
        "Foster independent creative time daily",
        "Celebrate calm behavior with positive words",
        "Introduce mindfulness activities like breathing",
      ],
    },
    {
      mainEmotion: "Excited",
      confidence: 89,
      emotions: [
        { name: "Excitement", percentage: 89, color: "#B89CFF" },
        { name: "Happiness", percentage: 76, color: "#90BE6D" },
        { name: "Anxiety", percentage: 24, color: "#F8961E" },
        { name: "Sadness", percentage: 8, color: "#577590" },
      ] as EmotionScore[],
      summary:
        "High energy and excitement radiate from this drawing. The child is enthusiastic and engaged with life — a very positive emotional state.",
      emotionalState: "High-energy, enthusiastic, engaged with the world",
      socialIndicators: "Very social, loves group activities",
      stressSignals: "Watch for over-stimulation but no major concerns",
      creativityLevel: 94,
      confidenceLevel: 87,
      recommendations: [
        "Channel excitement into structured activities",
        "Provide creative outlets like art classes",
        "Ensure enough rest to balance high energy",
      ],
    },
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

export default function DrawingCanvas() {
  const insets = useSafeAreaInsets();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { children, addDrawing } = useApp();
  const child = children.find((c) => c.id === childId);

  const [paths, setPaths] = useState<DrawPath[]>([]);
  const currentPointsRef = useRef<Point[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("pencil");
  const [selectedColor, setSelectedColor] = useState("#1A0F2E");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<Point[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const getBrushWidth = () => {
    if (activeTool === "brush") return 10;
    if (activeTool === "eraser") return 24;
    return 4;
  };

  const getStrokeColor = () => {
    if (activeTool === "eraser") return "#FFFFFF";
    return selectedColor;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const pt = { x: locationX, y: locationY };
      currentPointsRef.current = [pt];
      setCurrentPathPoints([pt]);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const pt = { x: locationX, y: locationY };
      currentPointsRef.current = [...currentPointsRef.current, pt];
      setCurrentPathPoints([...currentPointsRef.current]);
    },
    onPanResponderRelease: () => {
      if (currentPointsRef.current.length > 0) {
        const newPath: DrawPath = {
          points: [...currentPointsRef.current],
          color: getStrokeColor(),
          width: getBrushWidth(),
          isEraser: activeTool === "eraser",
        };
        setPaths((prev) => [...prev, newPath]);
        currentPointsRef.current = [];
        setCurrentPathPoints([]);
      }
    },
  });

  const handleUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPaths([]);
    setCurrentPathPoints([]);
  };

  const handleAnalyze = async () => {
    if (paths.length === 0) return;
    setIsAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((r) => setTimeout(r, 2200));
    const analysis = generateMockAnalysis();
    const pathsJson = JSON.stringify(paths);
    await addDrawing({
      childId: childId ?? "",
      pathsJson,
      ...analysis,
    });
    setIsAnalyzing(false);
    const allDrawingsId = `drawing-${Date.now()}`;
    router.replace({
      pathname: "/analysis-result",
      params: { childId: childId ?? "" },
    });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad, paddingBottom: botPad + 10 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1A0F2E" />
        </TouchableOpacity>
        {child && (
          <View style={styles.childInfo}>
            <ChildAvatar
              name={child.name}
              initials={child.initials}
              avatarColor={child.avatarColor}
              size={38}
              showName={false}
            />
            <View>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childAge}>Age {child.age}</Text>
            </View>
          </View>
        )}
        <View style={styles.undoClearRow}>
          <TouchableOpacity onPress={handleUndo} style={styles.toolMini}>
            <Ionicons name="arrow-undo" size={18} color="#6C4DFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.toolMini}>
            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas */}
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
                stroke={getStrokeColor()}
                strokeWidth={getBrushWidth()}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
          {paths.length === 0 && currentPathPoints.length === 0 && (
            <View style={styles.canvasHint}>
              <Ionicons name="brush-outline" size={48} color="#DDD6FF" />
              <Text style={styles.canvasHintText}>Start drawing here</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tools */}
      <View style={styles.toolsSection}>
        {/* Color Picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorsRow}
        >
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => {
                setSelectedColor(c);
                if (activeTool === "eraser") setActiveTool("pencil");
              }}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                c === "#FFFFFF" && styles.colorDotWhite,
                selectedColor === c &&
                  activeTool !== "eraser" &&
                  styles.colorDotSelected,
              ]}
            />
          ))}
        </ScrollView>

        {/* Tool Buttons */}
        <View style={styles.toolsRow}>
          {(["pencil", "brush", "eraser"] as Tool[]).map((tool) => (
            <TouchableOpacity
              key={tool}
              onPress={() => setActiveTool(tool)}
              style={[styles.toolBtn, activeTool === tool && styles.toolBtnActive]}
            >
              <Ionicons
                name={
                  tool === "pencil"
                    ? "pencil"
                    : tool === "brush"
                    ? "brush"
                    : "remove-circle-outline"
                }
                size={22}
                color={activeTool === tool ? "#FFFFFF" : "#6C4DFF"}
              />
              <Text
                style={[
                  styles.toolLabel,
                  activeTool === tool && styles.toolLabelActive,
                ]}
              >
                {tool.charAt(0).toUpperCase() + tool.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
            <Ionicons name="save-outline" size={20} color="#6C4DFF" />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={paths.length === 0 || isAnalyzing}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={
                paths.length === 0
                  ? ["#C4B8FF", "#D4BEFF"]
                  : ["#6C4DFF", "#9B7FFF"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyzeBtn}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Analyzing Modal */}
      <Modal visible={isAnalyzing} transparent animationType="fade">
        <View style={styles.analyzingOverlay}>
          <LinearGradient
            colors={["#6C4DFF", "#9B7FFF"]}
            style={styles.analyzingCard}
          >
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.analyzingTitle}>AI is Analyzing...</Text>
            <Text style={styles.analyzingText}>
              Reading emotional patterns in the drawing
            </Text>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  childInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  childName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A0F2E",
    fontFamily: "Inter_700Bold",
  },
  childAge: {
    fontSize: 12,
    color: "#8B7BAB",
    fontFamily: "Inter_400Regular",
  },
  undoClearRow: {
    flexDirection: "row",
    gap: 8,
  },
  toolMini: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FF",
  },
  canvasWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  canvas: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#DDD6FF",
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  canvasHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    pointerEvents: "none",
  },
  canvasHintText: {
    fontSize: 16,
    color: "#DDD6FF",
    fontFamily: "Inter_500Medium",
  },
  toolsSection: {
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 6,
  },
  colorsRow: {
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorDotWhite: {
    borderWidth: 1,
    borderColor: "#DDD6FF",
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: "#6C4DFF",
  },
  toolsRow: {
    flexDirection: "row",
    gap: 10,
  },
  toolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EDE9FF",
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#DDD6FF",
  },
  toolBtnActive: {
    backgroundColor: "#6C4DFF",
    borderColor: "#6C4DFF",
  },
  toolLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
  },
  toolLabelActive: {
    color: "#FFFFFF",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EDE9FF",
    borderRadius: 27,
    paddingHorizontal: 20,
    height: 52,
    borderWidth: 1,
    borderColor: "#DDD6FF",
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6C4DFF",
    fontFamily: "Inter_600SemiBold",
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 27,
    height: 52,
    shadowColor: "#6C4DFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  analyzeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  analyzingOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,15,46,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingCard: {
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 48,
    alignItems: "center",
    gap: 16,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  analyzingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});

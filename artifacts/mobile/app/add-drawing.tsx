import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import type { EmotionScore } from "@/context/AppContext";

// ── Mock AI analysis engine ───────────────────────────────────────────────────
const EMOTIONS = ["Happy", "Sad", "Angry", "Anxiety", "Fear"] as const;
const EMOTION_COLORS: Record<string, string> = {
  Happy:   "#90BE6D",
  Sad:     "#577590",
  Angry:   "#F3722C",
  Anxiety: "#F8961E",
  Fear:    "#C4B0FF",
};

const SUMMARIES: Record<string, string[]> = {
  Happy: [
    "This drawing suggests emotional comfort, creativity, and positive social feelings. The child appears to be in a secure and nurturing environment.",
    "Vibrant and expressive, this drawing reflects a child who is thriving emotionally and feels safe to express joy freely.",
  ],
  Sad: [
    "This drawing indicates some underlying sadness. The child may be processing a recent emotional experience. Overall creative expression remains healthy.",
    "The drawing shows signs of emotional introspection. The child is communicating feelings of sadness in a healthy, expressive way through art.",
  ],
  Angry: [
    "The drawing reveals feelings of frustration and anger. This is healthy emotional expression. The child is processing big feelings through art.",
    "Bold strokes and intense color choices suggest the child is working through feelings of frustration or anger. Art is a positive outlet for these emotions.",
  ],
  Anxiety: [
    "There are indicators of mild anxiety in this drawing. The child may be experiencing some worry or uncertainty about their environment.",
    "The drawing suggests some anxious feelings. Providing reassurance and open conversation can help the child process these emotions.",
  ],
  Fear: [
    "This drawing shows signs of fearfulness. The child may be working through something that feels overwhelming or scary to them.",
    "The drawing reflects some fearful emotions. Creating a safe, calm environment and encouraging open dialogue will help the child feel supported.",
  ],
};

const EMOTIONAL_STATES: Record<string, string[]> = {
  Happy:   ["Positive and stable emotional baseline with high energy", "Excellent emotional stability and positivity"],
  Sad:     ["Experiencing mild melancholy, needs extra attention", "Processing some sadness; additional support may help"],
  Angry:   ["Processing frustration in a healthy way through art", "Elevated emotional intensity; may need help with regulation"],
  Anxiety: ["Mild anxiety present; benefit from reassurance routines", "Some worry or nervous energy in current environment"],
  Fear:    ["Working through fearful feelings via creative expression", "Fearful emotional state; safe space and dialogue recommended"],
};

const RECOMMENDATIONS: Record<string, string[][]> = {
  Happy: [
    ["Encourage outdoor play and exploration", "Maintain positive reinforcement strategies", "Continue creative activities to boost expression"],
    ["Celebrate achievements to build confidence", "Introduce new creative challenges", "Maintain current positive environment"],
  ],
  Sad: [
    ["Create open conversations about feelings", "Schedule more play dates and social activities", "Offer comfort activities like drawing or reading together"],
    ["Practice daily check-ins about how they feel", "Engage in joyful activities together", "Provide extra warmth and physical comfort"],
  ],
  Angry: [
    ["Teach emotional regulation techniques", "Identify and address sources of frustration", "Practice calming exercises together daily"],
    ["Create a calm-down corner with sensory tools", "Validate the child's feelings without judgment", "Model healthy anger expression"],
  ],
  Anxiety: [
    ["Establish consistent routines to reduce uncertainty", "Practice breathing exercises together", "Provide reassurance before new situations"],
    ["Limit exposure to stressful triggers when possible", "Use storytelling to process anxious feelings", "Schedule quiet, predictable downtime daily"],
  ],
  Fear: [
    ["Create a safe, predictable environment", "Gently explore what the child is afraid of", "Use play to build confidence around feared situations"],
    ["Provide extra physical comfort and reassurance", "Read books about feelings and bravery together", "Avoid forced exposure — move at the child's pace"],
  ],
};

function generateMockAnalysis(description: string) {
  const seed     = description.length + Date.now() % 100;
  const mainIdx  = seed % EMOTIONS.length;
  const emotion  = EMOTIONS[mainIdx];
  const confidence = 65 + (seed % 30); // 65–94

  const emotions: EmotionScore[] = EMOTIONS.map((name, i) => {
    const base = name === emotion ? confidence : 10 + ((seed * (i + 3)) % 35);
    return { name, percentage: Math.min(base, 99), color: EMOTION_COLORS[name] };
  }).sort((a, b) => b.percentage - a.percentage);

  const summaries = SUMMARIES[emotion];
  const summary   = summaries[seed % summaries.length];
  const states    = EMOTIONAL_STATES[emotion];
  const state     = states[seed % states.length];
  const recs      = RECOMMENDATIONS[emotion];
  const recSet    = recs[seed % recs.length];

  return {
    mainEmotion:      emotion,
    confidence,
    emotions,
    summary,
    emotionalState:   state,
    socialIndicators: confidence > 80 ? "Strong peer connections, feels included and valued" : "Some social withdrawal noted; encourage group activities",
    stressSignals:    confidence > 75 ? "Minimal stress indicators present" : "Moderate stress indicators — monitor closely",
    creativityLevel:  60 + (seed % 38),
    confidenceLevel:  55 + (seed % 40),
    recommendations:  recSet,
  };
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function AddDrawingScreen() {
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;
  const botPad  = Platform.OS === "web" ? 34 : insets.bottom;
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { children, addDrawing } = useApp();

  const child = children.find((c) => c.id === childId);

  const [imageUri,     setImageUri]     = useState<string | null>(null);
  const [description,  setDescription]  = useState("");
  const [analyzing,    setAnalyzing]    = useState(false);

  // Animations
  const imageScale  = useRef(new Animated.Value(0.85)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(imageScale,   { toValue: 1,    useNativeDriver: true, speed: 16, bounciness: 8 }),
        Animated.timing(imageOpacity, { toValue: 1,    duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(imageScale,   { toValue: 1,    useNativeDriver: true, speed: 16, bounciness: 8 }),
        Animated.timing(imageOpacity, { toValue: 1,    duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }

  async function handleAnalyze() {
    if (!imageUri) return;
    setAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Shimmer animation during "AI analysis"
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    // Simulate AI processing
    await new Promise((res) => setTimeout(res, 800));

    const analysis = generateMockAnalysis(description || "neutral drawing");

    const drawingId = await addDrawing({
      childId: childId!,
      pathsJson: JSON.stringify({ imageUri }),
      imageUri: imageUri ?? undefined,
      ...analysis,
    });

    setAnalyzing(false);
    shimmerAnim.stopAnimation();

    // Navigate with the exact drawing ID so analysis-result resolves immediately
    router.replace({
      pathname: "/analysis-result",
      params: { childId: childId!, drawingId },
    });
  }

  if (!child) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#4A3070" />
        </TouchableOpacity>
        <Text style={styles.notFound}>Child not found</Text>
      </View>
    );
  }

  const canAnalyze = !!imageUri && !analyzing;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ paddingTop: topPad }}>
        {/* Nav */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#4A3070" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Add Drawing</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Child chip */}
        <View style={styles.childChip}>
          <LinearGradient
            colors={[child.avatarColor + "DD", child.avatarColor]}
            style={styles.childChipAvatar}
          >
            <Text style={styles.childChipInitials}>{child.initials}</Text>
          </LinearGradient>
          <Text style={styles.childChipName}>Drawing for <Text style={{ color: child.avatarColor, fontFamily: "Inter_700Bold" }}>{child.name}</Text></Text>
        </View>

        {/* ── Image section ── */}
        <Text style={styles.sectionLabel}>Drawing Image</Text>

        {imageUri ? (
          /* Image preview */
          <Animated.View style={[styles.imagePreviewWrap, { opacity: imageOpacity, transform: [{ scale: imageScale }] }]}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            {/* Change overlay */}
            <Pressable style={styles.changeOverlay} onPress={pickFromGallery}>
              <View style={styles.changeOverlayInner}>
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={styles.changeOverlayText}>Change</Text>
              </View>
            </Pressable>
          </Animated.View>
        ) : (
          /* Upload placeholder */
          <View style={styles.uploadArea}>
            <LinearGradient
              colors={["#F0E8FF", "#FDF8F5"]}
              style={styles.uploadPlaceholder}
            >
              <View style={styles.uploadIconWrap}>
                <Ionicons name="image-outline" size={38} color="#C4B0FF" />
              </View>
              <Text style={styles.uploadPlaceholderTitle}>No image selected</Text>
              <Text style={styles.uploadPlaceholderSub}>
                Tap a button below to add the drawing
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Upload buttons */}
        <View style={styles.uploadBtnsRow}>
          <TouchableOpacity onPress={pickFromGallery} activeOpacity={0.85} style={{ flex: 1 }}>
            <LinearGradient
              colors={["#C4A8F5", "#D4B0F0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadBtn}
            >
              <Ionicons name="images-outline" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>Gallery</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFromCamera} activeOpacity={0.85} style={{ flex: 1 }}>
            <LinearGradient
              colors={["#F0A8C8", "#C4A8F5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadBtn}
            >
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Description ── */}
        <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Parent Description</Text>
        <Text style={styles.descriptionHint}>
          Describe the situation, context, or any observations about this drawing. The AI will use this to provide better insights.
        </Text>
        <View style={[styles.descriptionBox, description.length > 0 && styles.descriptionBoxFocused]}>
          <TextInput
            style={styles.descriptionInput}
            placeholder={"Describe the situation, child's mood, and any notes about this drawing…"}
            placeholderTextColor="#B0A0CC"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* ── Analyze button ── */}
        {analyzing ? (
          <View style={styles.analyzingCard}>
            <Animated.View style={[styles.analyzingDot, { opacity: shimmerAnim }]}>
              <Ionicons name="sparkles" size={18} color="#A78BFA" />
            </Animated.View>
            <View>
              <Text style={styles.analyzingTitle}>AI is analyzing the drawing…</Text>
              <Text style={styles.analyzingSubtitle}>Looking for emotional patterns and insights</Text>
            </View>
            <ActivityIndicator size="small" color="#A78BFA" />
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={canAnalyze ? ["#C4A8F5", "#D4B0F0", "#F0A8C8"] : ["#C0B0D8", "#D0C0E8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyzeBtn}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.analyzeBtnText}>
                {imageUri ? "Analyze Drawing" : "Add an image to continue"}
              </Text>
              {imageUri && <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for better analysis</Text>
          {[
            "Use clear, well-lit photos of the drawing",
            "Include the full drawing in the frame",
            "Add context about when and why the child drew it",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F5" },
  notFound:  { fontSize: 16, color: "#A090B8", textAlign: "center", marginTop: 40, fontFamily: "Inter_400Regular" },
  navBar:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  navTitle:  { fontSize: 18, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  scroll:    { paddingHorizontal: 20, paddingTop: 8 },

  /* Child chip */
  childChip: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, alignSelf: "flex-start", marginBottom: 22, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  childChipAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  childChipInitials: { fontSize: 13, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  childChipName: { fontSize: 13, color: "#5A4A7A", fontFamily: "Inter_500Medium" },

  /* Section label */
  sectionLabel: { fontSize: 15, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold", marginBottom: 12, letterSpacing: -0.2 },

  /* Image */
  imagePreviewWrap: { borderRadius: 24, overflow: "hidden", marginBottom: 14, height: 220, backgroundColor: "#F0E8FF" },
  imagePreview:     { width: "100%", height: "100%" },
  changeOverlay:    { position: "absolute", bottom: 12, right: 12 },
  changeOverlayInner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  changeOverlayText: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold", fontWeight: "600" },

  uploadArea: { marginBottom: 14 },
  uploadPlaceholder: { borderRadius: 24, height: 190, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 2, borderColor: "#D4C8FF", borderStyle: "dashed" },
  uploadIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(108,77,255,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  uploadPlaceholderTitle: { fontSize: 15, fontWeight: "700", color: "#4A3880", fontFamily: "Inter_700Bold" },
  uploadPlaceholderSub: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 220 },

  uploadBtnsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 18, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 7 },
  uploadBtnText: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },

  /* Description */
  descriptionHint: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_400Regular", marginBottom: 10, lineHeight: 18 },
  descriptionBox: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: "#EAD4F5", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, minHeight: 130 },
  descriptionBoxFocused: { borderColor: "#A78BFA" },
  descriptionInput: { fontSize: 14, color: "#4A3070", fontFamily: "Inter_400Regular", lineHeight: 22, flex: 1, minHeight: 100 },
  charCount: { fontSize: 10, color: "#C0B0D8", fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 8 },

  /* Analyze button */
  analyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 28, marginBottom: 20, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 10 },
  analyzeBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },

  /* Analyzing card */
  analyzingCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: "#EAD4F5" },
  analyzingDot: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#F0E8FF", alignItems: "center", justifyContent: "center" },
  analyzingTitle: { fontSize: 14, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  analyzingSubtitle: { fontSize: 12, color: "#A090B8", fontFamily: "Inter_400Regular", marginTop: 2 },

  /* Tips */
  tipsCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, gap: 10, borderWidth: 1, borderColor: "#F0E8FF" },
  tipsTitle: { fontSize: 13, fontWeight: "700", color: "#4A3880", fontFamily: "Inter_700Bold", marginBottom: 4 },
  tipRow:  { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  tipDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: "#B89CFF", marginTop: 5 },
  tipText: { flex: 1, fontSize: 12, color: "#7A6A9A", fontFamily: "Inter_400Regular", lineHeight: 18 },
});

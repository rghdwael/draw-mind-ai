import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
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
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";

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
        
        {/* 🚨 MATCHING THE WELCOME BANNER GRADIENT */}
        <LinearGradient 
          colors={["#C4A8F5", "#F0A8C8"]} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 0 }} 
          style={ov.card}
        >
          <Animated.View style={[ov.iconWrap, { transform: [{ scale: pulse }] }]}>
            <Ionicons name="sparkles" size={40} color="#FFFFFF" />
          </Animated.View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Image 
              source={require("@/assets/images/whale-magnifier.png")} 
              style={{ width: 130, height: 130 }} 
              resizeMode="contain" 
            />
            <Text style={ov.title}>Analyzing...</Text>
          </View>

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
  useEffect(() => {
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
  backdrop:  { flex: 1, backgroundColor: "rgba(255, 255, 255, 0.75)", alignItems: "center", justifyContent: "center", padding: 32 },
  
  // 🚨 REMOVED backgroundColor SO THE GRADIENT SHOWS THROUGH
  card:      { borderRadius: 32, paddingVertical: 44, paddingHorizontal: 36, alignItems: "center", gap: 16, width: "100%", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 15 },
  
  iconWrap:  { width: 84, height: 84, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title:     { fontSize: 24, fontWeight: "800", color: "#FFFFFF", fontFamily: "Inter_700Bold", letterSpacing: -0.4 }, 
  dotsRow:   { flexDirection: "row", gap: 8, marginTop: 4 },
  dot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFFFFF" }, 
  hint:      { fontSize: 12, color: "rgba(255, 255, 255, 0.8)", fontFamily: "Inter_400Regular" }, 
});

// ── Main Screen ──
export default function AddDrawingScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const appContext = useApp();
  
  const children = appContext?.children || [];
  const child = children.find((c: any) => String(c.id) === String(childId));

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [childNote, setChildNote] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  
  // Animations
  const imageScale = useRef(new Animated.Value(0.85)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;

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
      if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.parallel([
        Animated.spring(imageScale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 8 }),
        Animated.timing(imageOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
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
      if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.parallel([
        Animated.spring(imageScale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 8 }),
        Animated.timing(imageOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }

  async function handleAnalyze() {
    if (!imageUri || !childId) return;
    setAnalyzing(true);
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const formData = new FormData();
      formData.append("child_id", childId.toString());
      formData.append("parent_explanation", description.trim() || "No context provided by parent.");
      formData.append("child_description", childNote.trim() || "No context provided by child.");
      
      if (Platform.OS === "web") {
        const responseBlob = await fetch(imageUri);
        const blob = await responseBlob.blob();
        const filename = imageUri.split("/").pop() || "drawing.jpg";
        formData.append("file", blob, filename);
      } else {
        const filename = imageUri.split("/").pop() || "drawing.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append("file", { uri: imageUri, name: filename, type: type } as any);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); 

      const response = await fetch("http://127.0.0.1:8000/drawings", {
          method: "POST",
          body: formData,
          signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      setAnalyzing(false);

      if (response.ok && (data.success || data.drawing_id)) {
        if (appContext?.fetchDrawings) await appContext.fetchDrawings(childId);
        router.replace({
          pathname: "/analysis-result",
          params: { drawingId: String(data.drawing_id), childId: String(childId), freshImage: data.image_path, freshAnalysis: JSON.stringify(data.analysis)}
        });
      } else {
        alert(`Analysis failed: ${data.detail || "Unknown error"}`);
      }
    } catch (error) {
      setAnalyzing(false);
      alert("Connection error while connecting to server.");
    }
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

  // 🚨 NEW: Requires image AND both descriptions!
  const canAnalyze = !!imageUri && description.trim().length > 0 && childNote.trim().length > 0 && !analyzing;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={{ paddingTop: topPad }}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#4A3070" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Add Drawing</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Drawing Image</Text>

        {imageUri ? (
          <Animated.View style={[styles.imagePreviewWrap, { opacity: imageOpacity, transform: [{ scale: imageScale }] }]}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <Pressable style={styles.changeOverlay} onPress={pickFromGallery}>
              <View style={styles.changeOverlayInner}>
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={styles.changeOverlayText}>Change</Text>
              </View>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.uploadArea}>
            <LinearGradient colors={["#F0E8FF", "#FDF8F5"]} style={styles.uploadPlaceholder}>
              <View style={styles.uploadIconWrap}>
                <Ionicons name="image-outline" size={38} color="#C4B0FF" />
              </View>
              <Text style={styles.uploadPlaceholderTitle}>No image selected</Text>
              <Text style={styles.uploadPlaceholderSub}>Tap a button below to add the drawing</Text>
            </LinearGradient>
          </View>
        )}

        <View style={styles.uploadBtnsRow}>
          <TouchableOpacity onPress={pickFromGallery} activeOpacity={0.85} style={{ flex: 1 }}>
            <LinearGradient colors={["#C4A8F5", "#D4B0F0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.uploadBtn}>
              <Ionicons name="images-outline" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>Gallery</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFromCamera} activeOpacity={0.85} style={{ flex: 1 }}>
            <LinearGradient colors={["#F0A8C8", "#C4A8F5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.uploadBtn}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 4 }]}>User Description</Text>
        <View style={[styles.descriptionBox, description.length > 0 && styles.descriptionBoxFocused]}>
          <TextInput
            style={styles.descriptionInput}
            placeholder={"Describe the situation, child's mood, and any notes about this drawing…"}
            placeholderTextColor="#B0A0CC"
            value={description}
            onChangeText={setDescription}
            multiline numberOfLines={5} textAlignVertical="top" maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 4 }]}>Child Description</Text>
        <View style={[styles.descriptionBox, childNote.length > 0 && styles.descriptionBoxFocused]}>
          <TextInput
            style={styles.descriptionInput}
            placeholder={"What did the child say about their drawing? Enter their own words here."}
            placeholderTextColor="#B0A0CC"
            value={childNote}
            onChangeText={setChildNote}
            multiline numberOfLines={4} textAlignVertical="top" maxLength={300}
          />
          <Text style={styles.charCount}>{childNote.length}/300</Text>
        </View>

        {/* Tips Section (Moved Above Button!) */}
        <View style={[styles.tipsCard, { marginBottom: 24 }]}>
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

        {/* 🚨 Smart Button at the very bottom! */}
        <TouchableOpacity onPress={handleAnalyze} disabled={!canAnalyze} activeOpacity={0.88}>
          <LinearGradient
            colors={canAnalyze ? ["#C4A8F5", "#D4B0F0", "#F0A8C8"] : ["#C0B0D8", "#D0C0E8"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.analyzeBtn}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.analyzeBtnText}>
              {!imageUri 
                ? "Add an image to continue" 
                : (!description.trim() || !childNote.trim()) 
                  ? "Fill descriptions to continue" 
                  : "Analyze Drawing"}
            </Text>
            {canAnalyze && <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* 🚨 The Full-Screen Modal Overlay! */}
      <AnalyzingOverlay visible={analyzing} childName={child?.name ?? "child"} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EDE5FF" },
  notFound: { fontSize: 16, color: "#A090B8", textAlign: "center", marginTop: 40, fontFamily: "Inter_400Regular" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: "#4A3070", fontFamily: "Inter_700Bold", marginBottom: 12, letterSpacing: -0.2 },
  imagePreviewWrap: { borderRadius: 24, overflow: "hidden", marginBottom: 14, height: 220, backgroundColor: "#F0E8FF" },
  imagePreview: { width: "100%", height: "100%" },
  changeOverlay: { position: "absolute", bottom: 12, right: 12 },
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
  descriptionBox: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: "#EAD4F5", shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, minHeight: 130 },
  descriptionBoxFocused: { borderColor: "#A78BFA" },
  descriptionInput: { fontSize: 14, color: "#4A3070", fontFamily: "Inter_400Regular", lineHeight: 22, flex: 1, minHeight: 100 },
  charCount: { fontSize: 10, color: "#C0B0D8", fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 8 },
  analyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 28, marginBottom: 20, shadowColor: "#C4A8F5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 10 },
  analyzeBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  tipsCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, gap: 10, borderWidth: 1, borderColor: "#F0E8FF" },
  tipsTitle: { fontSize: 13, fontWeight: "700", color: "#4A3880", fontFamily: "Inter_700Bold", marginBottom: 4 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#B89CFF", marginTop: 5 },
  tipText: { flex: 1, fontSize: 12, color: "#7A6A9A", fontFamily: "Inter_400Regular", lineHeight: 18 },
});
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientButton } from "@/components/GradientButton";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -15, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <LinearGradient
      // الألوان الجديدة التي تعطي إحساس السحر (Pastel Dreamy Gradient)
      colors={["#B298FF", "#FFADE1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}
    >
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Animated.View style={[styles.mascotWrap, { transform: [{ translateY: floatAnim }] }]}>
          <Image
            source={require("../assets/images/whale-paintbrush.png")}
            style={styles.mascot}
            contentFit="contain"
          />
        </Animated.View>

        <Text style={styles.appName}>Draw Mind AI</Text>
        <Text style={styles.tagline}>
          Understand your child's world{"\n"}
          <Text style={{ fontWeight: "600" }}>with the power of AI</Text>
        </Text>

        <View style={styles.btnWrap}>
          <GradientButton
            label="Get Started"
            onPress={() => router.push("/login")}
            size="lg"
            style={styles.btn}
          />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orb1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.3)",
    top: -50,
    left: -50,
  },
  orb2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255,255,255,0.2)",
    bottom: 50,
    right: -50,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
    width: "100%",
  },
  mascotWrap: {
    marginBottom: 40,
  },
  mascot: {
    width: 220,
    height: 220,
  },
  appName: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF", // لون أبيض ليكون أوضح
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 16,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: "#FDFDFD", // لون فاتح
    textAlign: "center",
    lineHeight: 28,
    fontFamily: "Inter_400Regular",
    marginBottom: 56,
  },
  btnWrap: {
    width: "100%",
  },
  btn: {
    width: "100%",
    // يمكنك هنا إضافة shadow للزر ليعطي إحساس الـ Glassmorphism
  },
});
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    await login(email, name || email.split("@")[0] || "Parent");
    setLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={["#F8EEFF", "#FDE8F3", "#FFF5F0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 12, paddingBottom: botPad + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#4A3070" />
          </TouchableOpacity>

          {/* Whale mascot */}
          <View style={styles.mascotWrap}>
            <Image
              source={require("../assets/images/whale-paintbrush.png")}
              style={styles.mascot}
              contentFit="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp ? "Join Draw Mind AI today" : "Sign in to continue"}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color="#B0A0C8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#C0B0D8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#B0A0C8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#C0B0D8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#B0A0C8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#C0B0D8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="#B0A0C8"
                />
              </TouchableOpacity>
            </View>

            {!isSignUp && (
              <TouchableOpacity style={styles.forgotWrap}>
                <Text style={styles.forgot}>Forget Password?</Text>
              </TouchableOpacity>
            )}

            {/* Sign In / Sign Up button */}
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={loading}
              style={styles.submitBtnWrap}
            >
              <LinearGradient
                colors={["#A78BFA", "#9B7FEE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? "Please wait…" : isSignUp ? "Create Account" : "Sign In"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <Text style={styles.orText}>or continue with</Text>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={styles.googleG}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-apple" size={22} color="#4A3070" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="mail-outline" size={20} color="#A78BFA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Switch Sign In / Sign Up */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.switchLink}>
                {isSignUp ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 28,
    flexGrow: 1,
  },

  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },

  mascotWrap: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 4,
  },
  mascot: {
    width: 110,
    height: 110,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#3D2B6E",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#A090B8",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 32,
  },

  form: {
    gap: 14,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 18,
    paddingHorizontal: 18,
    height: 56,
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#4A3070",
    fontFamily: "Inter_400Regular",
  },
  eyeBtn: {
    padding: 4,
  },

  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgot: {
    fontSize: 13,
    color: "#A78BFA",
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },

  submitBtnWrap: {
    marginTop: 4,
  },
  submitBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },

  orText: {
    fontSize: 13,
    color: "#B0A0C8",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginVertical: 4,
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  googleG: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4285F4",
    fontFamily: "Inter_700Bold",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  switchText: {
    fontSize: 14,
    color: "#A090B8",
    fontFamily: "Inter_400Regular",
  },
  switchLink: {
    fontSize: 14,
    color: "#A78BFA",
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
});

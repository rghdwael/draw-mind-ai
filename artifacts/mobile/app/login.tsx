import { Ionicons } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import { auth, isFirebaseConfigured } from "@/lib/firebase";
import {
  getAuthErrorMessage,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/authErrors";
import { useApp } from "@/context/AppContext";

type Mode = "sign-in" | "sign-up" | "forgot-password";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useApp();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  const isLoading = loadingEmail || loadingGoogle || loadingApple;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  function clearErrors() {
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setAuthError(null);
  }

  function switchMode(next: Mode) {
    clearErrors();
    setResetSent(false);
    setMode(next);
  }

  async function handleEmailAuth() {
    clearErrors();
    let hasError = false;

    if (mode === "sign-up") {
      const ne = validateName(name);
      if (ne) { setNameError(ne); hasError = true; }
    }

    const ee = validateEmail(email);
    if (ee) { setEmailError(ee); hasError = true; }

    if (mode !== "forgot-password") {
      const pe = validatePassword(password);
      if (pe) { setPasswordError(pe); hasError = true; }
    }

    if (hasError) return;

    if (!isFirebaseConfigured) {
      await login(email, name || email.split("@")[0] || "Parent");
      router.replace("/(tabs)");
      return;
    }

    setLoadingEmail(true);
    try {
      if (mode === "forgot-password") {
        await sendPasswordResetEmail(auth, email.trim());
        setResetSent(true);
      } else if (mode === "sign-in") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.replace("/(tabs)");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, {
          displayName: name.trim() || email.split("@")[0],
        });
        await login(email.trim(), name.trim() || email.split("@")[0]);
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const msg = (err as { message?: string })?.message ?? "";
      if (__DEV__) console.warn("[Auth error]", code, msg);
      setAuthError(getAuthErrorMessage(code, msg));
    } finally {
      setLoadingEmail(false);
    }
  }

  async function handleGoogle() {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Google Sign-In",
        "Google Sign-In is available on the web version of the app.",
        [{ text: "OK" }]
      );
      return;
    }
    if (!isFirebaseConfigured) return;
    clearErrors();
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const displayName =
        result.user.displayName ||
        result.user.email?.split("@")[0] ||
        "Parent";
      await login(result.user.email ?? "", displayName);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const msg = (err as { message?: string })?.message ?? "";
      if (__DEV__) console.warn("[Google Auth error]", code, msg);
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setAuthError(getAuthErrorMessage(code, msg));
      }
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleApple() {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Apple Sign-In",
        "Apple Sign-In is available on the web version of the app.",
        [{ text: "OK" }]
      );
      return;
    }
    if (!isFirebaseConfigured) return;
    clearErrors();
    setLoadingApple(true);
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      const result = await signInWithPopup(auth, provider);
      const displayName =
        result.user.displayName ||
        result.user.email?.split("@")[0] ||
        "Parent";
      await login(result.user.email ?? "", displayName);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const msg = (err as { message?: string })?.message ?? "";
      if (__DEV__) console.warn("[Apple Auth error]", code, msg);
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setAuthError(getAuthErrorMessage(code, msg));
      }
    } finally {
      setLoadingApple(false);
    }
  }

  const titleMap: Record<Mode, string> = {
    "sign-in": "Welcome Back",
    "sign-up": "Create Account",
    "forgot-password": "Reset Password",
  };

  const subtitleMap: Record<Mode, string> = {
    "sign-in": "Sign in to continue",
    "sign-up": "Join Draw Mind AI today",
    "forgot-password": "We'll send a reset link to your email",
  };

  return (
    <LinearGradient
      colors={["#EDE5FF", "#F2DEFF", "#F8E8FF"]}
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
          <TouchableOpacity
            onPress={() =>
              mode !== "sign-in" ? switchMode("sign-in") : router.back()
            }
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#4A3070" />
          </TouchableOpacity>

          <View style={styles.mascotWrap}>
            <Image
              source={require("../assets/images/whale-paintbrush.png")}
              style={styles.mascot}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>{titleMap[mode]}</Text>
          <Text style={styles.subtitle}>{subtitleMap[mode]}</Text>

          <View style={styles.form}>
            {mode === "sign-up" && (
              <View>
                <View
                  style={[
                    styles.inputWrap,
                    nameError ? styles.inputError : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={nameError ? "#FF6B6B" : "#B0A0C8"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#C0B0D8"
                    value={name}
                    onChangeText={(t) => { setName(t); setNameError(null); }}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
                {nameError ? (
                  <Text style={styles.fieldError}>{nameError}</Text>
                ) : null}
              </View>
            )}

            <View>
              <View
                style={[
                  styles.inputWrap,
                  emailError ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={emailError ? "#FF6B6B" : "#B0A0C8"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#C0B0D8"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {emailError ? (
                <Text style={styles.fieldError}>{emailError}</Text>
              ) : null}
            </View>

            {mode !== "forgot-password" && (
              <View>
                <View
                  style={[
                    styles.inputWrap,
                    passwordError ? styles.inputError : null,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={passwordError ? "#FF6B6B" : "#B0A0C8"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={
                      mode === "sign-up"
                        ? "Password (min 8 characters)"
                        : "Password"
                    }
                    placeholderTextColor="#C0B0D8"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setPasswordError(null); }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={18}
                      color="#B0A0C8"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={styles.fieldError}>{passwordError}</Text>
                ) : null}
              </View>
            )}

            {mode === "sign-in" && (
              <TouchableOpacity
                style={styles.forgotWrap}
                onPress={() => switchMode("forgot-password")}
              >
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {authError ? (
              <View style={styles.authErrorWrap}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}

            {resetSent ? (
              <View style={styles.successWrap}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                <Text style={styles.successText}>
                  Reset email sent! Check your inbox.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleEmailAuth}
              activeOpacity={0.85}
              disabled={isLoading}
              style={[styles.submitBtnWrap, isLoading && styles.disabledBtn]}
            >
              <LinearGradient
                colors={["#A78BFA", "#9B7FEE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loadingEmail ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {mode === "sign-in"
                      ? "Sign In"
                      : mode === "sign-up"
                      ? "Create Account"
                      : "Send Reset Email"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {mode !== "forgot-password" && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.orText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                  <Pressable
                    onPress={handleGoogle}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.socialBtn,
                      pressed && styles.socialBtnPressed,
                      isLoading && styles.disabledBtn,
                    ]}
                  >
                    {loadingGoogle ? (
                      <ActivityIndicator color="#4285F4" size="small" />
                    ) : (
                      <Text style={styles.googleG}>G</Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={handleApple}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      styles.socialBtn,
                      pressed && styles.socialBtnPressed,
                      isLoading && styles.disabledBtn,
                    ]}
                  >
                    {loadingApple ? (
                      <ActivityIndicator color="#4A3070" size="small" />
                    ) : (
                      <Ionicons name="logo-apple" size={22} color="#4A3070" />
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {mode === "forgot-password" ? (
            <View style={styles.switchRow}>
              <TouchableOpacity onPress={() => switchMode("sign-in")}>
                <Text style={styles.switchLink}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>
                {mode === "sign-in"
                  ? "Don't have an account? "
                  : "Already have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  switchMode(mode === "sign-in" ? "sign-up" : "sign-in")
                }
              >
                <Text style={styles.switchLink}>
                  {mode === "sign-in" ? "Sign Up" : "Sign In"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  inputError: {
    borderColor: "#FFAAA5",
    backgroundColor: "rgba(255,240,240,0.8)",
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

  fieldError: {
    fontSize: 12,
    color: "#FF6B6B",
    fontFamily: "Inter_400Regular",
    marginTop: 5,
    marginLeft: 8,
  },

  authErrorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,107,107,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.25)",
  },
  authErrorText: {
    flex: 1,
    fontSize: 13,
    color: "#D32F2F",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  successWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(76,175,80,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.25)",
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: "#2E7D32",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
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
  disabledBtn: {
    opacity: 0.65,
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

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(180,160,210,0.3)",
  },
  orText: {
    fontSize: 13,
    color: "#B0A0C8",
    fontFamily: "Inter_400Regular",
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialBtn: {
    width: 60,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(200,180,240,0.2)",
  },
  socialBtnPressed: {
    backgroundColor: "rgba(240,230,255,0.9)",
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
    flexWrap: "wrap",
    gap: 4,
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

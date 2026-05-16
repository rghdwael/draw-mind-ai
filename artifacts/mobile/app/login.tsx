import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
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
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useApp } from "@/context/AppContext";
import { validateEmail, validatePassword, validateName } from "@/utils/authStorage";

WebBrowser.maybeCompleteAuthSession();

// ── Shake animation helper ────────────────────────────────────────────────────
function useShake() {
  const anim = useRef(new Animated.Value(0)).current;
  const shake = () => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };
  return { anim, shake };
}

// ── Google Sign-In button (isolated so the hook always has a truthy webClientId) ──
interface GoogleBtnProps {
  disabled: boolean;
  onStart: () => void;
  onSuccess: (email: string, name: string) => void;
  onError: (msg: string) => void;
  onCancel: () => void;
}

function GoogleSignInButton({ disabled, onStart, onSuccess, onError, onCancel }: GoogleBtnProps) {
  const configuredId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const [loading, setLoading] = useState(false);

  // Always pass a truthy webClientId to satisfy expo-auth-session's invariant.
  // When unconfigured we use a placeholder — the flow will fail gracefully.
  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: configuredId || "not-configured",
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      const token = response.authentication?.accessToken;
      if (token) {
        fetchGoogleUser(token);
      } else {
        setLoading(false);
        onError("Google sign-in failed. No token returned.");
      }
    } else if (response.type === "error") {
      setLoading(false);
      onError("Google sign-in failed. Please try again.");
    } else if (response.type === "dismiss" || response.type === "cancel") {
      setLoading(false);
      onCancel();
    }
  }, [response]);

  async function fetchGoogleUser(accessToken: string) {
    try {
      const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = await res.json();
      if (!user.email) throw new Error("No email returned");
      onSuccess(user.email, user.name ?? user.email);
    } catch {
      onError("Could not retrieve Google account info. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const handlePress = async () => {
    if (!configuredId) {
      onError("Google Sign-In requires EXPO_PUBLIC_GOOGLE_CLIENT_ID to be configured.");
      return;
    }
    setLoading(true);
    onStart();
    await promptAsync();
  };

  return (
    <TouchableOpacity
      style={[styles.socialBtn, (!configuredId || disabled || loading) && styles.socialBtnDisabled]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#4285F4" size="small" />
      ) : (
        <Text style={styles.googleG}>G</Text>
      )}
    </TouchableOpacity>
  );
}

// ── Password strength indicator ───────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score =
    (len >= 8 ? 1 : 0) +
    (len >= 12 ? 1 : 0) +
    (hasUpper ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSpecial ? 1 : 0);

  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const colors = ["", "#E05252", "#F8961E", "#F3C94A", "#90BE6D", "#48CAE4"];
  const label = labels[Math.min(score, 5)];
  const color = colors[Math.min(score, 5)];

  return (
    <View style={psStyles.wrap}>
      <View style={psStyles.bars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[psStyles.bar, { backgroundColor: score >= i ? color : "#E8DEFF" }]}
          />
        ))}
      </View>
      <Text style={[psStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const psStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -4 },
  bars: { flex: 1, flexDirection: "row", gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", width: 64, textAlign: "right" },
});

// ── Main login screen ─────────────────────────────────────────────────────────
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, register, loginWithSocial } = useApp();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [formErr, setFormErr] = useState("");

  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailErr, setForgotEmailErr] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const { anim: formAnim, shake } = useShake();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── Field change handlers ─────────────────────────────────────────────────
  const onEmailChange    = (v: string) => { setEmail(v);    setEmailErr("");    setFormErr(""); };
  const onPasswordChange = (v: string) => { setPassword(v); setPasswordErr(""); setFormErr(""); };
  const onNameChange     = (v: string) => { setName(v);     setNameErr("");     setFormErr(""); };

  const switchMode = () => {
    setIsSignUp((p) => !p);
    setEmailErr(""); setPasswordErr(""); setNameErr(""); setFormErr("");
    setEmail(""); setPassword(""); setName("");
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  function validateForm(): boolean {
    let ok = true;
    if (isSignUp) {
      const ne = validateName(name);
      if (ne) { setNameErr(ne); ok = false; }
    }
    const ee = validateEmail(email);
    if (ee) { setEmailErr(ee); ok = false; }
    const pe = validatePassword(password);
    if (pe) { setPasswordErr(pe); ok = false; }
    return ok;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateForm()) { shake(); return; }
    setLoading(true);
    setFormErr("");
    try {
      const result = isSignUp
        ? await register(email.trim(), password, name.trim())
        : await signIn(email.trim(), password);
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        setFormErr(result.error ?? "Authentication failed.");
        shake();
      }
    } catch {
      setFormErr("A network error occurred. Please try again.");
      shake();
    } finally {
      setLoading(false);
    }
  };

  // ── Google callbacks ──────────────────────────────────────────────────────
  const handleGoogleSuccess = async (gEmail: string, gName: string) => {
    const result = await loginWithSocial(gEmail, gName, "google");
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setFormErr(result.error ?? "Google sign-in failed.");
    }
  };

  // ── Apple Sign-In ─────────────────────────────────────────────────────────
  const handleApple = async () => {
    if (Platform.OS !== "ios") {
      setFormErr("Apple Sign-In is only available on iOS devices.");
      return;
    }
    const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
    if (!available) {
      setFormErr("Apple Sign-In is not available on this device.");
      return;
    }
    setAppleLoading(true);
    setFormErr("");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const aEmail = credential.email ?? `apple_${credential.user}@privaterelay.appleid.com`;
      const aName =
        credential.fullName?.givenName
          ? `${credential.fullName.givenName} ${credential.fullName.familyName ?? ""}`.trim()
          : "Apple User";
      const result = await loginWithSocial(aEmail, aName, "apple");
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        setFormErr(result.error ?? "Apple sign-in failed.");
      }
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code !== "ERR_REQUEST_CANCELED") {
        setFormErr("Apple Sign-In failed. Please try again.");
      }
    } finally {
      setAppleLoading(false);
    }
  };

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgotSubmit = async () => {
    const err = validateEmail(forgotEmail);
    if (err) { setForgotEmailErr(err); return; }
    setForgotLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setForgotLoading(false);
    setForgotSent(true);
  };

  const closeForgot = () => {
    setForgotVisible(false);
    setForgotEmail(""); setForgotEmailErr("");
    setForgotSent(false); setForgotLoading(false);
  };

  const anyLoading = loading || appleLoading;

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
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={anyLoading}
          >
            <Ionicons name="arrow-back" size={22} color="#4A3070" />
          </TouchableOpacity>

          {/* Mascot */}
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
          <Animated.View
            style={[styles.form, { transform: [{ translateX: formAnim }] }]}
          >
            {/* Name field — sign-up only */}
            {isSignUp && (
              <View>
                <View style={[styles.inputWrap, nameErr ? styles.inputWrapError : null]}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={nameErr ? "#E05252" : "#B0A0C8"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#C0B0D8"
                    value={name}
                    onChangeText={onNameChange}
                    autoCapitalize="words"
                    returnKeyType="next"
                    editable={!anyLoading}
                  />
                </View>
                {!!nameErr && <Text style={styles.fieldErr}>{nameErr}</Text>}
              </View>
            )}

            {/* Email field */}
            <View>
              <View style={[styles.inputWrap, emailErr ? styles.inputWrapError : null]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={emailErr ? "#E05252" : "#B0A0C8"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#C0B0D8"
                  value={email}
                  onChangeText={onEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!anyLoading}
                />
                {email.length > 0 && !emailErr && (
                  <Ionicons name="checkmark-circle" size={18} color="#90BE6D" />
                )}
              </View>
              {!!emailErr && <Text style={styles.fieldErr}>{emailErr}</Text>}
            </View>

            {/* Password field */}
            <View>
              <View style={[styles.inputWrap, passwordErr ? styles.inputWrapError : null]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={passwordErr ? "#E05252" : "#B0A0C8"}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password (min 8 characters)"
                  placeholderTextColor="#C0B0D8"
                  value={password}
                  onChangeText={onPasswordChange}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  editable={!anyLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
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
              {!!passwordErr && <Text style={styles.fieldErr}>{passwordErr}</Text>}
            </View>

            {/* Password strength (sign-up only) */}
            {isSignUp && password.length > 0 && (
              <PasswordStrength password={password} />
            )}

            {/* Forgot password */}
            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotWrap}
                onPress={() => setForgotVisible(true)}
                disabled={anyLoading}
              >
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Form error banner */}
            {!!formErr && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#B01212" />
                <Text style={styles.errorBannerText}>{formErr}</Text>
              </View>
            )}

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={anyLoading}
              style={[styles.submitBtnWrap, anyLoading && { opacity: 0.7 }]}
            >
              <LinearGradient
                colors={["#A78BFA", "#9B7FEE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              {/* Google — in its own component to isolate the hook */}
              <GoogleSignInButton
                disabled={anyLoading}
                onStart={() => setFormErr("")}
                onSuccess={handleGoogleSuccess}
                onError={(msg) => setFormErr(msg)}
                onCancel={() => {}}
              />

              {/* Apple */}
              <TouchableOpacity
                style={[
                  styles.socialBtn,
                  (Platform.OS !== "ios" || appleLoading) && styles.socialBtnDisabled,
                ]}
                onPress={handleApple}
                disabled={appleLoading || loading}
                activeOpacity={0.7}
              >
                {appleLoading ? (
                  <ActivityIndicator color="#4A3070" size="small" />
                ) : (
                  <Ionicons
                    name="logo-apple"
                    size={22}
                    color={Platform.OS !== "ios" ? "#C0B0D8" : "#4A3070"}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Platform notes */}
            {Platform.OS !== "ios" && (
              <Text style={styles.socialNote}>Apple Sign-In available on iOS only</Text>
            )}
          </Animated.View>

          {/* Switch mode */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={switchMode} disabled={anyLoading}>
              <Text style={styles.switchLink}>
                {isSignUp ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Forgot Password Modal ──────────────────────────────────────────── */}
      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={closeForgot}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={closeForgot} style={styles.modalClose}>
                <Ionicons name="close" size={20} color="#8070A0" />
              </TouchableOpacity>
            </View>

            {forgotSent ? (
              <View style={styles.forgotSentWrap}>
                <View style={styles.forgotSentIcon}>
                  <Ionicons name="mail" size={28} color="#A78BFA" />
                </View>
                <Text style={styles.forgotSentTitle}>Check your inbox</Text>
                <Text style={styles.forgotSentBody}>
                  If an account exists for{" "}
                  <Text style={{ fontFamily: "Inter_700Bold" }}>{forgotEmail}</Text>,
                  a password reset link has been sent.
                </Text>
                <TouchableOpacity style={styles.forgotSentBtn} onPress={closeForgot}>
                  <Text style={styles.forgotSentBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.modalBody}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    forgotEmailErr ? styles.inputWrapError : null,
                    { marginBottom: 4 },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={forgotEmailErr ? "#E05252" : "#B0A0C8"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#C0B0D8"
                    value={forgotEmail}
                    onChangeText={(v) => { setForgotEmail(v); setForgotEmailErr(""); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!forgotLoading}
                  />
                </View>
                {!!forgotEmailErr && (
                  <Text style={[styles.fieldErr, { marginBottom: 12 }]}>
                    {forgotEmailErr}
                  </Text>
                )}
                {!forgotEmailErr && <View style={{ height: 16 }} />}
                <TouchableOpacity
                  onPress={handleForgotSubmit}
                  disabled={forgotLoading}
                  style={[styles.submitBtnWrap, forgotLoading && { opacity: 0.7 }]}
                >
                  <LinearGradient
                    colors={["#A78BFA", "#9B7FEE"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.submitBtn, { height: 50 }]}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>Send Reset Link</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 28, flexGrow: 1 },

  backBtn: { alignSelf: "flex-start", marginBottom: 8 },

  mascotWrap: { alignItems: "center", marginBottom: 20, marginTop: 4 },
  mascot: { width: 110, height: 110 },

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

  form: { gap: 14 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
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
  inputWrapError: {
    borderColor: "#E05252",
    backgroundColor: "rgba(255,235,235,0.85)",
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#4A3070",
    fontFamily: "Inter_400Regular",
  },
  eyeBtn: { padding: 4 },

  fieldErr: {
    fontSize: 12,
    color: "#C03030",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginLeft: 6,
  },

  forgotWrap: { alignSelf: "flex-end", marginTop: -4 },
  forgot: {
    fontSize: 13,
    color: "#A78BFA",
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(224,82,82,0.10)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(224,82,82,0.22)",
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#B01212",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  submitBtnWrap: { marginTop: 4 },
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
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#D8CCFF" },
  orText: {
    fontSize: 13,
    color: "#B0A0C8",
    fontFamily: "Inter_400Regular",
  },

  socialRow: { flexDirection: "row", justifyContent: "center", gap: 16 },
  socialBtn: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
  },
  socialBtnDisabled: { opacity: 0.45 },
  googleG: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4285F4",
    fontFamily: "Inter_700Bold",
  },

  socialNote: {
    fontSize: 11,
    color: "#B0A0C8",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: -6,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(50,30,100,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FDF8FF",
    borderRadius: 28,
    padding: 28,
    shadowColor: "#7B5CE5",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3D2B6E",
    fontFamily: "Inter_700Bold",
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F0E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    fontSize: 14,
    color: "#8070A0",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 20,
  },

  forgotSentWrap: { alignItems: "center", paddingVertical: 8 },
  forgotSentIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "#F0E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  forgotSentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3D2B6E",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  forgotSentBody: {
    fontSize: 14,
    color: "#8070A0",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  forgotSentBtn: {
    backgroundColor: "#A78BFA",
    borderRadius: 20,
    paddingHorizontal: 36,
    paddingVertical: 13,
  },
  forgotSentBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
});

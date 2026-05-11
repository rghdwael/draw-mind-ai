import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LANGUAGES = [
  {
    code: "en",
    label: "English",
    native: "English",
    flag: "🇺🇸",
    dir: "ltr",
  },
  {
    code: "ar",
    label: "Arabic",
    native: "العربية",
    flag: "🇸🇦",
    dir: "rtl",
  },
];

const LANG_KEY = "@draw_mind_language";

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [selected, setSelected] = useState("en");

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((val) => {
      if (val) setSelected(val);
    });
  }, []);

  async function handleSelect(code: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(code);
    await AsyncStorage.setItem(LANG_KEY, code);
    // In a full i18n setup this would update the locale context.
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1A0F2E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.body, { paddingBottom: botPad + 24 }]}>
        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={["#90BE6D", "#52A030"]} style={styles.heroIcon}>
            <Ionicons name="language-outline" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.heroTitle}>Choose Language</Text>
          <Text style={styles.heroSub}>
            Select your preferred language. The app will update immediately.
          </Text>
        </View>

        {/* Language options */}
        <View style={styles.optionsList}>
          {LANGUAGES.map((lang) => {
            const active = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.85}
              >
                <View style={[styles.optionCard, active && styles.optionCardActive]}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <View style={styles.optionTexts}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {lang.label}
                    </Text>
                    <Text style={[styles.optionNative, active && { color: "#6C4DFF" }]}>
                      {lang.native}
                    </Text>
                  </View>
                  {active ? (
                    <LinearGradient colors={["#6C4DFF", "#9B7FFF"]} style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </LinearGradient>
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.footerNote}>
          More languages will be available in future updates.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F1FF" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  navTitle: { fontSize: 18, fontWeight: "700", color: "#1A0F2E", fontFamily: "Inter_700Bold" },

  body: { flex: 1, paddingHorizontal: 20 },

  hero: { alignItems: "center", gap: 10, marginBottom: 32, marginTop: 8 },
  heroIcon: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#90BE6D", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#1A0F2E", fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: "#8B7BAB", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 280 },

  optionsList: { gap: 12 },
  optionCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: "#fff", borderRadius: 22, padding: 18,
    borderWidth: 2, borderColor: "transparent",
    shadowColor: "#6C4DFF", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  optionCardActive: { borderColor: "#6C4DFF", backgroundColor: "#F8F5FF" },
  flag: { fontSize: 32 },
  optionTexts: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 17, fontWeight: "700", color: "#1A0F2E", fontFamily: "Inter_700Bold" },
  optionLabelActive: { color: "#6C4DFF" },
  optionNative: { fontSize: 13, color: "#8B7BAB", fontFamily: "Inter_400Regular" },
  checkCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  emptyCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#DDD6FF" },

  footerNote: { fontSize: 12, color: "#B0A0CC", fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 28 },
});

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}

export function GradientButton({
  onPress,
  label,
  loading,
  disabled,
  style,
  size = "md",
  variant = "primary",
}: Props) {
  const colors = useColors();
  const heights = { sm: 44, md: 54, lg: 62 };
  const fontSizes = { sm: 14, md: 16, lg: 18 };
  const h = heights[size];
  const fs = fontSizes[size];

  const gradientColors: [string, string] =
    variant === "primary"
      ? ["#C4A8F5", "#F0A8C8"]
      : ["#DDD0FF", "#F5C8E0"];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      disabled={disabled || loading}
      style={[style, { opacity: disabled ? 0.55 : 1 }]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, { height: h, borderRadius: h / 2 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.label, { fontSize: fs }]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C4A8F5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: "Inter_700Bold",
  },
});

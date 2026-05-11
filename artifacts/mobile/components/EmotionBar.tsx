import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface Props {
  label: string;
  percentage: number;
  color: string;
  delay?: number;
}

export function EmotionBar({ label, percentage, color, delay = 0 }: Props) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: percentage / 100,
      duration: 900,
      delay,
      useNativeDriver: false,
    }).start();
  }, [percentage, delay]);

  const widthInterpolated = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.pct, { color }]}>{percentage}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: widthInterpolated.interpolate({
                inputRange: ["0%", "100%"],
                outputRange: [`${0}%`, `${percentage}%`],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#1A0F2E",
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  pct: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  track: {
    height: 10,
    backgroundColor: "#EDE9FF",
    borderRadius: 10,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 10,
  },
});

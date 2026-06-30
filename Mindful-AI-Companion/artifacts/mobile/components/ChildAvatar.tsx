import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  name: string;
  initials: string;
  avatarColor: string;
  size?: number;
  showName?: boolean;
  selected?: boolean;
}

export function ChildAvatar({
  name,
  initials,
  avatarColor,
  size = 64,
  showName = true,
  selected = false,
}: Props) {
  const fontSize = size * 0.32;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: avatarColor,
            borderWidth: selected ? 3 : 0,
            borderColor: selected ? "#A78BFA" : "transparent",
          },
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </View>
      {showName && (
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 6,
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  initials: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 12,
    color: "#4A3070",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    maxWidth: 64,
    textAlign: "center",
  },
});

import { Feather, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({
  ionName,
  sfName,
  color,
  size,
}: {
  ionName: string;
  sfName: string;
  color: string;
  size: number;
}) {
  if (Platform.OS === "ios") {
    return <SymbolView name={sfName} tintColor={color} size={size} />;
  }
  return <Ionicons name={ionName as any} size={size} color={color} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const tabBarHeight = isWeb ? 84 : 62 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#B89CFF",
        tabBarInactiveTintColor: "rgba(184,156,255,0.45)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#24124D",
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: isWeb ? 0 : insets.bottom,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#24124D" }]} />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              ionName="home"
              sfName="house.fill"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="drawings"
        options={{
          title: "Drawings",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              ionName="images"
              sfName="photo.stack.fill"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              ionName="chatbubbles"
              sfName="bubble.left.and.bubble.right.fill"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              ionName="person"
              sfName="person.fill"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});

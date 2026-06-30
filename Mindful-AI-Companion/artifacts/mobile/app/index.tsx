import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        // Look directly at mobile storage to see if a token exists
        const userToken = await AsyncStorage.getItem("userToken"); // or whatever key your app uses for login data
        
        if (userToken) {
          router.replace("/(tabs)");
        } else {
          router.replace("/welcome");
        }
      } catch (error) {
        // If there's an error reading storage, default to welcome screen safely
        router.replace("/welcome");
      }
    }

    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EDE5FF" }}>
      <ActivityIndicator size="large" color="#A78BFA" />
    </View>
  );
}
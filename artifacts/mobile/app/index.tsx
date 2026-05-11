import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function Index() {
  const { isLoggedIn } = useApp();
  if (isLoggedIn) return <Redirect href="/(tabs)" />;
  return <Redirect href="/welcome" />;
}

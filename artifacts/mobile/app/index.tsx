import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";
import { setBaseUrl } from '../../../lib/api-client-react/src/custom-fetch';
setBaseUrl("http://localhost:5000");
export default function Index() {
  const { isLoggedIn } = useApp();
  if (isLoggedIn) return <Redirect href="/(tabs)" />;
  return <Redirect href="/welcome" />;
}

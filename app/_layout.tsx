import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";

import { PwaInstallBanner } from "@/components/pwa-install-banner";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {
        // Ignore registration failures in unsupported/strict environments.
      });
    }
  }, []);

  if (!fontsLoaded) {
    return null; // Or a splash screen
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="adminpanel"
          options={{ headerShown: false, title: "Admin Panel" }}
        />
        <Stack.Screen
          name="travellerlogin"
          options={{ headerShown: false, title: "Traveller Login" }}
        />
        <Stack.Screen
          name="travellerbus"
          options={{ headerShown: false, title: "Your Bus" }}
        />
        <Stack.Screen
          name="busdetails"
          options={{ headerShown: false, title: "Bus Details" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <PwaInstallBanner />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

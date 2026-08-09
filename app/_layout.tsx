import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";

import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="adminpanel"
          options={{ headerShown: false, title: "Admin Panel", href: null }}
        />
        <Stack.Screen
          name="travellerlogin"
          options={{ headerShown: false, title: "Traveller Login", href: null }}
        />
        <Stack.Screen
          name="travellerbus"
          options={{ headerShown: false, title: "Your Bus", href: null }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <PwaInstallBanner />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

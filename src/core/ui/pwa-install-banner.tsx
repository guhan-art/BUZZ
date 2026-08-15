import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  if (Platform.OS !== "web" || !deferredPrompt || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.banner}>
        <Text style={styles.title}>Install BUZZ App</Text>
        <Text style={styles.subtitle}>
          Add this app to your Android home screen.
        </Text>
        <View style={styles.actions}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => setDismissed(true)}
          >
            <Text style={styles.secondaryButtonText}>Later</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleInstall}>
            <Text style={styles.primaryButtonText}>Install</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: "center",
    zIndex: 1000,
  },
  banner: {
    width: "92%",
    maxWidth: 420,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#0f172a",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryButtonText: {
    color: "#052e16",
    fontWeight: "700",
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: 13,
  },
});

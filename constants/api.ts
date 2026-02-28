import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolve the backend URL automatically:
 *  1. Honour the explicit env-var if set.
 *  2. On web, localhost works fine.
 *  3. On Android/iOS the Expo dev-server's `hostUri` gives us the
 *     machine's LAN IP (e.g. "192.168.1.5:8081") — strip the Expo
 *     port and use the backend port instead.
 */
function getBaseUrl(): string {
  // Explicit override always wins
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl;

  const BACKEND_PORT = 5000;

  // Web can reach localhost directly
  if (Platform.OS === "web") {
    return `http://localhost:${BACKEND_PORT}`;
  }

  // On native, grab the dev-server host (LAN IP:port)
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? (Constants as any).manifest?.debuggerHost; // SDK 49+ // older SDKs

  if (debuggerHost) {
    const lanIp = debuggerHost.split(":")[0]; // strip Expo port
    return `http://${lanIp}:${BACKEND_PORT}`;
  }

  // Last resort
  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = getBaseUrl();

import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

const BACKEND_PORT = 5000;

function isInvalidNativeHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.startsWith("169.254.")
  );
}

function parseHostFromHostPort(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const host = withoutProtocol.split(":")[0];
  return host || null;
}

function parseHostFromUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

function getNativeDevHost(): string | null {
  const fromExpoConfig = parseHostFromHostPort(Constants.expoConfig?.hostUri);
  if (fromExpoConfig) return fromExpoConfig;

  const fromLegacyManifest = parseHostFromHostPort(
    (Constants as any).manifest?.debuggerHost,
  );
  if (fromLegacyManifest) return fromLegacyManifest;

  const fromExpoGoConfig = parseHostFromHostPort(
    (Constants as any).expoGoConfig?.debuggerHost,
  );
  if (fromExpoGoConfig) return fromExpoGoConfig;

  const fromScriptUrl = parseHostFromUrl(NativeModules?.SourceCode?.scriptURL);
  if (fromScriptUrl) return fromScriptUrl;

  return null;
}

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
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) return envUrl;

  const extraUrl = (
    Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined
  )?.apiBaseUrl?.trim();
  if (extraUrl) return extraUrl;

  // Web: use localhost in local dev, otherwise use same origin.
  // This allows a reverse-proxied deployment where frontend/backend
  // are served from the same domain.
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const isLocalhost = host === "localhost" || host === "127.0.0.1";
      if (isLocalhost) {
        return `http://localhost:${BACKEND_PORT}`;
      }
      return window.location.origin;
    }

    return `http://localhost:${BACKEND_PORT}`;
  }

  // On native, grab the dev-server host (LAN IP:port)
  const nativeDevHost = getNativeDevHost();
  if (nativeDevHost && !isInvalidNativeHost(nativeDevHost)) {
    return `http://${nativeDevHost}:${BACKEND_PORT}`;
  }

  // Last resort fallback for simulators.
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = getBaseUrl();

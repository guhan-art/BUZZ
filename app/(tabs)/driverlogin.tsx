import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    AppState,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../../constants/api";
import {
    startBackgroundLocation,
    stopBackgroundLocation,
} from "../../utils/background-location";

// -- Configuration --
const LOCATION_DISTANCE_INTERVAL_M = 30; // Only fire after 30m movement
const LOCATION_TIME_INTERVAL_MS = 10000; // But at least every 10 seconds
const LOCATION_PUSH_THROTTLE_MS = 10000; // Don't POST more than once per 10s

export default function DriverLoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [busId, setBusId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [locationInfo, setLocationInfo] = useState<{
    lat: number;
    lng: number;
    lastUpdate: string;
  } | null>(null);
  const [status, setStatus] = useState("");

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastPushRef = useRef<number>(0);
  const busIdRef = useRef<string | null>(null);

  // Keep busIdRef in sync
  useEffect(() => {
    busIdRef.current = busId;
  }, [busId]);

  // -- Location sending (throttled) --
  const sendLocationUpdate = useCallback(
    async (bId: string, loc: Location.LocationObject) => {
      const now = Date.now();
      if (now - lastPushRef.current < LOCATION_PUSH_THROTTLE_MS) return;
      lastPushRef.current = now;

      try {
        const response = await fetch(`${API_BASE_URL}/driver/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            busId: bId,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          }),
        });
        if (response.ok) {
          setLocationInfo({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            lastUpdate: new Date().toLocaleTimeString(),
          });
          setStatus(`Sharing location for Bus ${bId}`);
        }
      } catch (e) {
        console.error("Failed to send location", e);
        setStatus("Failed to send location update");
      }
    },
    [],
  );

  // -- Start / Stop GPS watcher --
  const stopWatching = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }, []);

  const startWatching = useCallback(
    async (bId: string) => {
      stopWatching();

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
          timeInterval: LOCATION_TIME_INTERVAL_MS,
        },
        (loc) => {
          sendLocationUpdate(bId, loc);
        },
      );
      watchRef.current = subscription;
    },
    [sendLocationUpdate, stopWatching],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => stopWatching();
  }, [stopWatching]);

  // -- AppState: pause/resume when app goes to background --
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const currentBusId = busIdRef.current;
      if (!currentBusId) return;

      if (nextState === "active" && sharing) {
        startWatching(currentBusId);
      } else if (nextState !== "active") {
        stopWatching();
      }
    });

    return () => subscription.remove();
  }, [sharing, startWatching, stopWatching]);

  // -- Login handler --
  const handleLogin = async () => {
    Keyboard.dismiss();
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    try {
      setStatus("Logging in...");
      const response = await fetch(`${API_BASE_URL}/driver/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        Alert.alert("Login Failed", data.error || "Phone number not found");
        setStatus("");
        return;
      }

      setBusId(data.busId);
      setStatus(`Logged in — Bus ${data.busId}`);

      // Request foreground permission and start watching
      const { status: permStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (permStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to share your bus location.",
        );
        setStatus("Location permission denied");
        return;
      }

      setSharing(true);
      startWatching(data.busId);

      // Start background tracking (non-blocking — if permission denied, foreground still works)
      startBackgroundLocation(String(data.busId)).catch(() => {});
      setStatus(`Sharing location for Bus ${data.busId}`);
    } catch (e) {
      console.error("Login error:", e);
      Alert.alert("Error", "Could not connect to server. Check your network.");
      setStatus("");
    }
  };

  // -- Stop sharing --
  const handleStopSharing = () => {
    stopWatching();
    stopBackgroundLocation().catch(() => {});
    setSharing(false);
    setLocationInfo(null);
    setStatus("Location sharing stopped");
  };

  // -- Logout --
  const handleLogout = () => {
    stopWatching();
    stopBackgroundLocation().catch(() => {});
    setSharing(false);
    setBusId(null);
    setPhone("");
    setLocationInfo(null);
    setStatus("");
    router.replace("/(tabs)");
  };

  // ── UI ──

  if (!busId) {
    // Login form
    return (
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={st.container}
      >
        <View style={st.card}>
          <Ionicons
            name="person-circle"
            size={64}
            color="#f857a6"
            style={{ alignSelf: "center", marginBottom: 12 }}
          />
          <Text style={st.heading}>Driver Login</Text>
          <Text style={st.subheading}>Enter your registered phone number</Text>

          <TextInput
            style={st.input}
            placeholder="Phone Number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            onSubmitEditing={handleLogin}
            returnKeyType="go"
          />

          <TouchableOpacity style={st.loginBtn} onPress={handleLogin}>
            <LinearGradient
              colors={["#f857a6", "#ff5858"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.loginBtnGrad}
            >
              <Text style={st.loginBtnText}>Login & Start Sharing</Text>
            </LinearGradient>
          </TouchableOpacity>

          {!!status && <Text style={st.statusText}>{status}</Text>}
        </View>
      </LinearGradient>
    );
  }

  // Sharing dashboard
  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={st.container}
    >
      <View style={st.card}>
        <View style={st.dashHeader}>
          <Ionicons name="bus" size={36} color="#38ef7d" />
          <Text style={st.dashTitle}>Bus {busId}</Text>
        </View>

        {/* Status badge */}
        <View style={[st.statusBadge, sharing ? st.statusLive : st.statusOff]}>
          <View
            style={[
              st.statusDot,
              { backgroundColor: sharing ? "#38ef7d" : "#ff5858" },
            ]}
          />
          <Text style={st.statusBadgeText}>
            {sharing ? "LIVE — Sharing Location" : "Paused"}
          </Text>
        </View>

        {/* Location info */}
        {locationInfo && (
          <View style={st.coordsCard}>
            <Text style={st.coordsLabel}>Last Known Position</Text>
            <Text style={st.coordsValue}>
              {locationInfo.lat.toFixed(6)}, {locationInfo.lng.toFixed(6)}
            </Text>
            <Text style={st.coordsTime}>
              Updated: {locationInfo.lastUpdate}
            </Text>
          </View>
        )}

        {!!status && <Text style={st.statusText}>{status}</Text>}

        {/* Action buttons */}
        <View style={st.btnRow}>
          {sharing ? (
            <TouchableOpacity
              style={[st.actionBtn, st.pauseBtn]}
              onPress={handleStopSharing}
            >
              <Ionicons name="pause" size={20} color="#fff" />
              <Text style={st.actionBtnText}>Pause</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[st.actionBtn, st.resumeBtn]}
              onPress={() => {
                if (busId) {
                  startWatching(busId);
                  setSharing(true);
                }
              }}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={st.actionBtnText}>Resume</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[st.actionBtn, st.logoutBtn]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={st.actionBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heading: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 16,
  },
  loginBtn: { borderRadius: 14, overflow: "hidden" },
  loginBtnGrad: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  statusText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
  },

  // Dashboard
  dashHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    justifyContent: "center",
  },
  dashTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusLive: {
    backgroundColor: "rgba(56,239,125,0.15)",
    borderWidth: 1,
    borderColor: "rgba(56,239,125,0.3)",
  },
  statusOff: {
    backgroundColor: "rgba(255,88,88,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,88,88,0.3)",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  coordsCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  coordsLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  coordsValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  coordsTime: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    marginTop: 6,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  pauseBtn: { backgroundColor: "rgba(255,152,0,0.8)" },
  resumeBtn: { backgroundColor: "rgba(56,239,125,0.7)" },
  logoutBtn: { backgroundColor: "rgba(255,88,88,0.7)" },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

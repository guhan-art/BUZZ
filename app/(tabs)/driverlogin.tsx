import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../constants/api";
import { driverToken, setDriverToken } from "../../constants/auth";
import { startBackgroundLocation, stopBackgroundLocation } from "../../utils/background-location";

const LOCATION_DISTANCE_INTERVAL_M = 30;
const LOCATION_TIME_INTERVAL_MS = 10000;
const LOCATION_PUSH_THROTTLE_MS = 10000;

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export default function DriverLoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [busId, setBusId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [locationInfo, setLocationInfo] = useState<{ lat: number; lng: number; lastUpdate: string } | null>(null);
  const [status, setStatus] = useState("");

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const webWatchIdRef = useRef<number | null>(null);
  const lastPushRef = useRef<number>(0);
  const busIdRef = useRef<string | null>(null);

  useEffect(() => {
    busIdRef.current = busId;
  }, [busId]);

  const sendLocationUpdate = useCallback(async (bId: string, loc: Location.LocationObject) => {
    const now = Date.now();
    if (now - lastPushRef.current < LOCATION_PUSH_THROTTLE_MS) return;
    lastPushRef.current = now;

    try {
      const response = await fetch(`${API_BASE_URL}/driver/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${driverToken}` },
        body: JSON.stringify({ busId: bId, latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
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
  }, []);

  const stopWatching = useCallback(() => {
    if (webWatchIdRef.current !== null) {
      try {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.clearWatch(webWatchIdRef.current);
        }
      } catch {}
      finally { webWatchIdRef.current = null; }
    }
    if (watchRef.current) {
      try { watchRef.current.remove(); } catch {}
      finally { watchRef.current = null; }
    }
  }, []);

  const startWatching = useCallback(async (bId: string) => {
    stopWatching();
    if (Platform.OS === "web") {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setStatus("Geolocation is not supported in this browser");
        return;
      }
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } } as Location.LocationObject;
          sendLocationUpdate(bId, loc);
        },
        () => setStatus("Unable to read device location"),
        { enableHighAccuracy: false, timeout: LOCATION_TIME_INTERVAL_MS, maximumAge: LOCATION_TIME_INTERVAL_MS }
      );
      webWatchIdRef.current = watchId;
      return;
    }

    const subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: LOCATION_DISTANCE_INTERVAL_M, timeInterval: LOCATION_TIME_INTERVAL_MS },
      (loc) => sendLocationUpdate(bId, loc)
    );
    watchRef.current = subscription;
  }, [sendLocationUpdate, stopWatching]);

  useEffect(() => {
    return () => stopWatching();
  }, [stopWatching]);

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

  const handleLogin = async () => {
    Keyboard.dismiss();
    const normalized = normalizePhone(phone);
    if (!normalized) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    try {
      setStatus("Logging in...");
      const response = await fetch(`${API_BASE_URL}/driver/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${driverToken}` },
        body: JSON.stringify({ phone: normalized }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        Alert.alert("Login Failed", data.error || "Phone number not found");
        setStatus("");
        return;
      }

      setDriverToken(data.token);
      setBusId(data.busId);
      setStatus(`Logged in — Bus ${data.busId}`);

      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to share your bus location.");
        setStatus("Location permission denied");
        return;
      }

      setSharing(true);
      try {
        const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await sendLocationUpdate(data.busId, initialLoc);
      } catch {}
      startWatching(data.busId);
      startBackgroundLocation(String(data.busId)).catch(() => {});
      setStatus(`Sharing location for Bus ${data.busId}`);
    } catch (e) {
      console.error("Login error:", e);
      Alert.alert("Error", "Could not connect to server. Check your network.");
      setStatus("");
    }
  };

  const handleStopSharing = () => {
    stopWatching();
    stopBackgroundLocation().catch(() => {});
    setSharing(false);
    setLocationInfo(null);
    setStatus("Location sharing stopped");
  };

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

  if (!busId) {
    return (
      <LinearGradient colors={["#000000", "#050508", "#111116"]} style={st.container}>
        {/* Glow Effects */}
        <View style={[st.orb, st.orb1]} />
        <View style={[st.orb, st.orb2]} />

        <BlurView intensity={30} tint="dark" style={st.card}>
          <View style={st.iconWrap}>
            <Ionicons name="bus" size={40} color="#E99B16" />
          </View>
          <Text style={st.heading}>Driver Access</Text>
          <Text style={st.subheading}>Enter your registered phone number</Text>

          <View style={st.inputWrap}>
            <Ionicons name="call" size={20} color="#8A8A93" style={st.inputIcon} />
            <TextInput
              style={st.input}
              placeholder="Phone Number"
              placeholderTextColor="#55555A"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
          </View>

          <TouchableOpacity onPress={handleLogin} style={st.loginBtnContainer}>
            <LinearGradient colors={["#E99B16", "#FFC043"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.loginBtnGrad}>
              <Text style={st.loginBtnText}>Authenticate</Text>
            </LinearGradient>
          </TouchableOpacity>

          {!!status && <Text style={st.statusText}>{status}</Text>}
        </BlurView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#000000", "#050508", "#111116"]} style={st.container}>
      <View style={[st.orb, st.orb1]} />
      
      <BlurView intensity={30} tint="dark" style={st.card}>
        <View style={st.dashHeader}>
          <Ionicons name="bus-outline" size={36} color="#E99B16" />
          <Text style={st.dashTitle}>Bus {busId}</Text>
        </View>

        <View style={[st.statusBadge, sharing ? st.statusLive : st.statusOff]}>
          <View style={[st.statusDot, { backgroundColor: sharing ? "#E99B16" : "#8A8A93" }]} />
          <Text style={[st.statusBadgeText, { color: sharing ? "#E99B16" : "#8A8A93" }]}>
            {sharing ? "LIVE — Transmitting" : "STANDBY"}
          </Text>
        </View>

        {locationInfo && (
          <View style={st.coordsCard}>
            <Text style={st.coordsLabel}>Telemetry Data</Text>
            <Text style={st.coordsValue}>{locationInfo.lat.toFixed(6)}, {locationInfo.lng.toFixed(6)}</Text>
            <Text style={st.coordsTime}>Last sync: {locationInfo.lastUpdate}</Text>
          </View>
        )}

        {!!status && <Text style={st.statusText}>{status}</Text>}

        <View style={st.btnRow}>
          {sharing ? (
            <TouchableOpacity style={[st.actionBtn, st.pauseBtn]} onPress={handleStopSharing}>
              <Ionicons name="pause" size={20} color="#000" />
              <Text style={st.actionBtnTextDark}>Halt</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[st.actionBtn, st.resumeBtn]} onPress={() => { if (busId) { startWatching(busId); setSharing(true); } }}>
              <Ionicons name="play" size={20} color="#000" />
              <Text style={st.actionBtnTextDark}>Transmit</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[st.actionBtn, st.logoutBtn]} onPress={handleLogout}>
            <Ionicons name="exit-outline" size={20} color="#FF453A" />
            <Text style={st.actionBtnTextLight}>Logout</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.15,
  },
  orb1: {
    width: 300, height: 300, backgroundColor: "#E99B16", top: -100, left: -100, filter: "blur(60px)",
  },
  orb2: {
    width: 250, height: 250, backgroundColor: "#2C77F4", bottom: -50, right: -100, filter: "blur(60px)",
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(20,20,25,0.4)",
    overflow: "hidden",
  },
  iconWrap: {
    alignSelf: "center",
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(233,155,22,0.1)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(233,155,22,0.3)"
  },
  heading: {
    fontFamily: "Outfit_700Bold", fontSize: 28, color: "#FFFFFF",
    textAlign: "center", letterSpacing: 0.5,
  },
  subheading: {
    fontFamily: "Outfit_400Regular", fontSize: 14, color: "#8A8A93",
    textAlign: "center", marginBottom: 32, marginTop: 4,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16, marginBottom: 24,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1, fontFamily: "Outfit_400Regular", color: "#FFFFFF",
    fontSize: 16, paddingVertical: 16,
  },
  loginBtnContainer: {
    shadowColor: "#E99B16", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  loginBtnGrad: {
    paddingVertical: 18, alignItems: "center", borderRadius: 16,
  },
  loginBtnText: {
    fontFamily: "Outfit_700Bold", fontSize: 16, color: "#000000",
  },
  statusText: {
    fontFamily: "Outfit_400Regular", color: "#E99B16",
    fontSize: 13, textAlign: "center", marginTop: 20,
  },

  dashHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginBottom: 24, justifyContent: "center",
  },
  dashTitle: {
    fontFamily: "Outfit_700Bold", fontSize: 32, color: "#FFFFFF",
  },
  statusBadge: {
    flexDirection: "row", alignItems: "center", alignSelf: "center",
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24,
    marginBottom: 24,
  },
  statusLive: {
    backgroundColor: "rgba(233,155,22,0.15)", borderWidth: 1, borderColor: "rgba(233,155,22,0.4)",
  },
  statusOff: {
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusBadgeText: {
    fontFamily: "Outfit_700Bold", fontSize: 13, letterSpacing: 1,
  },
  coordsCard: {
    backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 16, padding: 20,
    marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  coordsLabel: {
    fontFamily: "Outfit_500Medium", color: "#8A8A93", fontSize: 11,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
  },
  coordsValue: {
    fontFamily: "Courier", color: "#FFFFFF", fontSize: 16, fontWeight: "600",
  },
  coordsTime: {
    fontFamily: "Outfit_400Regular", color: "#55555A", fontSize: 12, marginTop: 8,
  },
  btnRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  pauseBtn: { backgroundColor: "#8A8A93" },
  resumeBtn: { backgroundColor: "#E99B16" },
  logoutBtn: { backgroundColor: "rgba(255,69,58,0.1)", borderWidth: 1, borderColor: "rgba(255,69,58,0.3)" },
  actionBtnTextDark: { fontFamily: "Outfit_700Bold", color: "#000", fontSize: 15 },
  actionBtnTextLight: { fontFamily: "Outfit_700Bold", color: "#FF453A", fontSize: 15 },
});

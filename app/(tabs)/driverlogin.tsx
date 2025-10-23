import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function DriverLogin() {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busId, setBusId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const login = async () => {
    if (!phone || phone.trim().length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }
    setStatus("Logging in...");
    try {
      const res = await fetch(`${API_BASE_URL}/driver/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        Alert.alert("Login Failed", data.error || "Invalid driver phone number");
        setStatus(null);
        return;
      }

      setBusId(String(data.busId));
      setStatus(`✓ Logged in as driver for Bus ${data.busId}`);
      await requestLocationAndStart(String(data.busId));
    } catch (e) {
      console.error("Login error:", e);
      Alert.alert("Error", "Network request failed. Check your connection.");
      setStatus(null);
    }
  };

  const requestLocationAndStart = async (bId: string) => {
    setStatus("Requesting location permission...");
    try {
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to share your bus location.");
        setStatus("❌ Location permission denied");
        setBusId(null);
        return;
      }
      setStatus("✓ Location permission granted. Starting location sharing...");
      startSharing(bId);
    } catch (error) {
      console.error("Location permission error:", error);
      Alert.alert("Error", "Failed to request location permission");
      setStatus("❌ Permission request failed");
      setBusId(null);
    }
  };

  const startSharing = (bId: string) => {
    setIsSharing(true);

    const sendOnce = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

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
          setStatus(
            `✓ Sharing location for Bus ${bId}
Lat: ${loc.coords.latitude.toFixed(6)}
Lon: ${loc.coords.longitude.toFixed(6)}
Last update: ${new Date().toLocaleTimeString()}`
          );
        } else {
          console.error("Failed to send location:", await response.text());
          setStatus("⚠ Failed to send location.");
        }
      } catch (e) {
        console.error("Failed to send location", e);
        setStatus("⚠ Failed to send location. Retrying...");
      }
    };

    sendOnce();
    intervalRef.current = setInterval(sendOnce, 5000);
  };

  const logout = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setBusId(null);
    setIsSharing(false);
    setStatus("Logged out successfully");
    setPhone("");
    setTimeout(() => router.push("/(tabs)/buslist"), 800);
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", backgroundColor: "#f5f7fa" }}>
      {!busId ? (
        <>
          <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
            Driver Login
          </Text>
          <TextInput
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 16,
              backgroundColor: "#fff",
            }}
          />
          <Button title="Login & Start Sharing Location" onPress={login} />
          {status ? <Text style={{ marginTop: 16, textAlign: "center", color: "#555" }}>{status}</Text> : null}
        </>
      ) : (
        <>
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 12,
              marginBottom: 20,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#1976d2" }}>
              🚌 Bus {busId}
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>
              {isSharing ? "🟢 Location sharing active" : "🔴 Location sharing inactive"}
            </Text>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 20 }}>{status}</Text>
          </View>

          <Button title="Stop & Logout" onPress={logout} color="#d32f2f" />
          <Text style={{ marginTop: 20, textAlign: "center", color: "#888", fontSize: 12 }}>
            Keep this screen open while driving
          </Text>
        </>
      )}
    </View>
  );
}
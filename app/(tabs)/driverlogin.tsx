import { useDriverLocation } from "@/hooks/use-driver-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function DriverLogin() {
  const [phone, setPhone] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busId, setBusId] = useState<string | null>(null);
  const { start, stop, status: locationStatus, lastLocation, lastError } =
    useDriverLocation(busId, {
      distanceThreshold: 50,
      timeThreshold: 15000,
      enableBackgroundUpdates: true,
      backgroundService: {
        notificationTitle: "BUZZ",
        notificationBody: "Sharing your live location",
      },
    });
  const router = useRouter();
  const isSharing = locationStatus === "running";

  const login = async () => {
    if (!phone || phone.trim().length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }
    setStatusMessage("Logging in...");
    try {
      const res = await fetch(`${API_BASE_URL}/driver/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        Alert.alert("Login Failed", data.error || "Invalid driver phone number");
        setStatusMessage(null);
        return;
      }

      setBusId(String(data.busId));
      setStatusMessage(`✓ Logged in as driver for Bus ${data.busId}`);
    } catch (e) {
      console.error("Login error:", e);
      Alert.alert("Error", "Network request failed. Check your connection.");
      setStatusMessage(null);
    }
  };

  const logout = () => {
    stop();
    setBusId(null);
    setStatusMessage("Logged out successfully");
    setPhone("");
    setTimeout(() => router.push("/(tabs)/buslist"), 800);
  };

  useEffect(() => {
    if (!busId) {
      return;
    }

    setStatusMessage("Requesting location permission...");
    start();

    return () => {
      stop();
    };
  }, [busId, start, stop]);

  useEffect(() => {
    if (!busId) {
      return;
    }

    if (lastError) {
      setStatusMessage(`⚠ ${lastError}`);
      if (lastError.toLowerCase().includes("permission")) {
        Alert.alert(
          "Location Permission Needed",
          "Location access is required to share your live bus position."
        );
        setBusId(null);
      }
    }
  }, [busId, lastError]);

  useEffect(() => {
    if (!busId || !lastLocation) {
      return;
    }

    if (locationStatus === "running") {
      const { latitude, longitude } = lastLocation.coords;
      const lastUpdate = new Date(
        typeof lastLocation.timestamp === "number"
          ? lastLocation.timestamp
          : Date.now()
      ).toLocaleTimeString();
      setStatusMessage(
        `✓ Sharing location for Bus ${busId}
Lat: ${latitude.toFixed(6)}
Lon: ${longitude.toFixed(6)}
Last update: ${lastUpdate}`
      );
    }
  }, [busId, lastLocation, locationStatus]);

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
          {statusMessage ? (
            <Text style={{ marginTop: 16, textAlign: "center", color: "#555" }}>{statusMessage}</Text>
          ) : null}
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
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 20 }}>
              {statusMessage ?? "Waiting for location updates..."}
            </Text>
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
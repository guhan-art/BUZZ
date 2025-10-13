import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function BusDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const fetchBus = async () => {
      try {
        const res = await fetch(`http://10.187.157.225:5000/buses/${id}`); // change IP to your PC’s IP
        if (!res.ok) throw new Error("Failed to fetch bus data");
        const data = await res.json();
        setBus(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBus();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={{ marginTop: 10 }}>Loading bus details...</Text>
      </View>
    );
  }

  if (error || !bus) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="alert-circle" size={60} color="#d32f2f" />
        <Text style={{ fontSize: 18, color: "#d32f2f", marginTop: 10 }}>
          {error || "Bus not found"}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: "#1976d2", fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fullscreen map view
  if (isFullScreen) {
    return (
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: bus.latitude,
            longitude: bus.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
            title={bus.name}
            description={bus.route}
          />
        </MapView>

        <TouchableOpacity
          onPress={() => setIsFullScreen(false)}
          style={{
            position: "absolute",
            top: 40,
            right: 20,
            backgroundColor: "#fff",
            borderRadius: 25,
            padding: 8,
            elevation: 3,
          }}
        >
          <Ionicons name="close" size={26} color="#1976d2" />
        </TouchableOpacity>
      </View>
    );
  }

  // Normal info + mini map
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f5f7fa" }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          backgroundColor: "#fff",
          borderRadius: 20,
          padding: 4,
        }}
      >
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          padding: 24,
          marginBottom: 18,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
          alignItems: "center",
        }}
      >
        <Ionicons name="bus" size={48} color="#1976d2" style={{ marginBottom: 10 }} />
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#1976d2", marginBottom: 6 }}>
          {bus.name}
        </Text>
        <Text style={{ fontSize: 15, color: "#888", marginBottom: 4 }}>{bus.route}</Text>
        <Text style={{ fontSize: 16, color: "#333" }}>
          Departure: <Text style={{ fontWeight: "600" }}>{bus.departureTime}</Text>
        </Text>
      </View>

      <MapView
        style={{ width: "100%", height: 200, borderRadius: 16, marginBottom: 20 }}
        initialRegion={{
          latitude: bus.latitude,
          longitude: bus.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
          title={bus.name}
          description={bus.route}
        />
      </MapView>

      <TouchableOpacity
        onPress={() => setIsFullScreen(true)}
        style={{
          backgroundColor: "#1976d2",
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Track</Text>
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 14,
          padding: 18,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Ionicons name="map" size={22} color="#1976d2" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1976d2" }}>Route Flow</Text>
        </View>
        {bus.stops && bus.stops.length > 0 ? (
          bus.stops.map((stop, idx) => (
            <View key={stop} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons
                name={
                  idx === 0
                    ? "ellipse"
                    : idx === bus.stops.length - 1
                    ? "flag"
                    : "radio-button-on"
                }
                size={16}
                color={
                  idx === 0
                    ? "#388e3c"
                    : idx === bus.stops.length - 1
                    ? "#d32f2f"
                    : "#1976d2"
                }
                style={{ marginRight: 10 }}
              />
              <Text style={{ fontSize: 16, color: "#444" }}>{stop}</Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 16, color: "gray" }}>No route details available.</Text>
        )}
      </View>
    </ScrollView>
  );
}

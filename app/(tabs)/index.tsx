// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <LinearGradient
      colors={["#e0f7fa", "#f0f8ff"]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}
    >
      {/* Header */}
      <Animated.Text
        style={{
          opacity: fadeAnim,
          fontSize: 34,
          fontWeight: "bold",
          marginBottom: 50,
          color: "#00796b",
          letterSpacing: 1,
        }}
      >
        🚍 BUZZ App
      </Animated.Text>

      {/* Bus List Button */}
      <AnimatedTouchable
        style={{ width: "80%", marginBottom: 20, borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}
        activeOpacity={0.85}
        onPress={() => router.push("/buslist")}
      >
        <LinearGradient
          colors={["#4caf50", "#2e7d32"]}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            borderRadius: 14,
          }}
        >
          <Ionicons name="list" size={24} color="#fff" style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 18, color: "#fff", fontWeight: "600" }}>
            View Bus List
          </Text>
        </LinearGradient>
      </AnimatedTouchable>

      {/* Map Button */}
      <AnimatedTouchable
        style={{ width: "80%", borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}
        activeOpacity={0.85}
        onPress={() =>
          router.push("/busdetails?id=1&name=Bus+101&route=Campus+to+Tambaram")
        }
      >
        <LinearGradient
          colors={["#2196f3", "#1565c0"]}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            borderRadius: 14,
          }}
        >
          <Ionicons name="map" size={24} color="#fff" style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 18, color: "#fff", fontWeight: "600" }}>
            Open Map
          </Text>
        </LinearGradient>
      </AnimatedTouchable>
    </LinearGradient>
  );
}

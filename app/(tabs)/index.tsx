import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity } from "react-native";
import { API_BASE_URL } from "../../constants/api";

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [firstBusId, setFirstBusId] = useState<number | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    fetchFirstBus();
  }, []);

  const fetchFirstBus = async () => {
    try {
      console.log('Fetching buses from:', `${API_BASE_URL}/buses`);
      const response = await fetch(`${API_BASE_URL}/buses`);
      
      if (response.ok) {
        const buses = await response.json();
        console.log('Fetched buses:', buses.length);
        if (buses.length > 0) {
          setFirstBusId(buses[0].id);
        }
      } else {
        console.error('Failed to fetch buses:', response.status);
      }
    } catch (error) {
      console.error("Error fetching buses:", error);
    }
  };

  const handleMapPress = () => {
    router.push("/map"); // open the Map tab
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <LinearGradient
      colors={["#e0f7fa", "#f0f8ff"]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}
    >
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

      <AnimatedTouchable
        style={{ width: "80%", borderRadius: 14, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}
        activeOpacity={0.85}
        onPress={handleMapPress}
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
// app/buslist.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

export default function BusList() {
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://10.187.157.225:5000/buses");
        const data = await res.json();
        setBuses(data);
      } catch (error) {
        console.error("Error fetching buses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading buses...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f7fa", padding: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#1976d2", marginBottom: 18 }}>
        Bus List
      </Text>

      <FlatList
        data={buses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 18,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
            onPress={() =>
              router.push(
                `/busdetails?id=${item.id}&name=${encodeURIComponent(item.name)}&route=${encodeURIComponent(
                  item.route
                )}&time=${encodeURIComponent(item.departureTime)}`
              )
            }
          >
            <Ionicons name="bus" size={28} color="#1976d2" style={{ marginRight: 16 }} />
            <View>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1976d2" }}>{item.name}</Text>
              <Text style={{ fontSize: 15, color: "#555" }}>{item.route}</Text>
              <Text style={{ fontSize: 14, color: "#388e3c" }}>Departure: {item.departureTime}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

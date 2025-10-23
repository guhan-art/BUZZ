import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../constants/api";

interface Bus {
  id: string;
  name: string;
  route: string;
  latitude: number | null;
  longitude: number | null;
  stops: string[];
  departureTime: string;
}

export default function BusListScreen() {
  const router = useRouter();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      console.log("Fetching buses from:", `${API_BASE_URL}/buses`);
      const response = await fetch(`${API_BASE_URL}/buses`);
      if (!response.ok) throw new Error("Failed to fetch buses");
      const data = await response.json();
      console.log("Fetched buses:", data.length);
      setBuses(data);
    } catch (error) {
      console.error("Error fetching buses:", error);
      Alert.alert("Error", "Could not load bus data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleBusPress = (bus: Bus) => {
    router.push({
      pathname: "/busdetails",
      params: {
        id: bus.id,
        time: bus.departureTime,
      },
    });
  };

  const renderBusCard = ({ item }: { item: Bus }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => handleBusPress(item)}
    >
      <LinearGradient
        colors={["#ffffff", "#f5f5f5"]}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.busIconContainer}>
            <Ionicons name="bus" size={28} color="#2196f3" />
          </View>
          <View style={styles.busHeaderInfo}>
            <Text style={styles.busNumber}>{item.name}</Text>
            <Text style={styles.departureTime}>{item.departureTime}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.routeContainer}>
            <Ionicons name="navigate" size={18} color="#666" />
            <Text style={styles.routeText} numberOfLines={2}>
              {item.route}
            </Text>
          </View>

          <View style={styles.stopsContainer}>
            <Ionicons name="location" size={18} color="#4caf50" />
            <Text style={styles.stopsText}>
              {item.stops?.length || 0} stops
            </Text>
          </View>

          {item.latitude && item.longitude && (
            <View style={styles.locationContainer}>
              <Ionicons name="pin" size={16} color="#ff9800" />
              <Text style={styles.locationText}>
                Live tracking available
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>Tap to view details</Text>
          <Ionicons name="chevron-forward" size={20} color="#2196f3" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading buses...</Text>
      </View>
    );
  }

  if (buses.length === 0) {
    return (
      <LinearGradient colors={["#e3f2fd", "#ffffff"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1976d2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Available Buses</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bus-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No buses available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBuses}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#e3f2fd", "#ffffff"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1976d2" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Available Buses</Text>
          <Text style={styles.headerSubtitle}>
            {buses.length} {buses.length === 1 ? "bus" : "buses"} running
          </Text>
        </View>
        <TouchableOpacity onPress={fetchBuses} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#1976d2" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={buses}
        renderItem={renderBusCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchBuses}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 54,
    backgroundColor: "transparent",
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1976d2",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#2196f3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: { padding: 15, paddingBottom: 30 },
  card: {
    marginBottom: 15,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: { borderRadius: 16, padding: 16 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  busIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
  },
  busHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  busNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  departureTime: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  cardBody: { marginBottom: 12 },
  routeContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: "#444",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  stopsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  stopsText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#ff9800",
    marginLeft: 6,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#2196f3",
    fontWeight: "500",
  },
});
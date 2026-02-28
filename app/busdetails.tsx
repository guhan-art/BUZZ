import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    MapView,
    Marker,
    Polyline,
    PROVIDER_GOOGLE,
} from "../components/map-view";
import { API_BASE_URL } from "../constants/api";

interface Stop {
  id: number;
  name: string;
  lat: number;
  lng: number;
  busId: number;
}

interface Bus {
  id: string;
  name: string;
  route: string;
  location: string;
  stops: Stop[];
}

export default function BusDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const busId = String(params.id || "");

  const [bus, setBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullScreenMap, setFullScreenMap] = useState(false);

  useEffect(() => {
    if (!busId) return;
    fetchBusDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busId]);

  const fetchBusDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/buses/${busId}`);
      if (!res.ok) throw new Error(`Failed to fetch bus ${busId}`);
      const data: Bus = await res.json();
      setBus(data);
    } catch (e) {
      console.error("Error fetching bus details:", e);
      Alert.alert("Error", "Could not load bus details.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading bus details...</Text>
      </View>
    );
  }

  if (!bus) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Bus not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Safely parse "lat,lng" string
  const [lat, lng] =
    bus.location?.split(",").map((v) => Number(String(v).trim())) ?? [];
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  // Fallback to Chennai if invalid coordinates
  const region = hasCoords
    ? {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 13.0827,
        longitude: 80.2707,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };

  const stops = Array.isArray(bus.stops) ? bus.stops : [];

  // Map rendering function (reusable for both preview and full screen)
  const renderMap = (style: any) => (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={style}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton
    >
      {/* Bus current location marker */}
      {hasCoords && (
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          title={bus.name}
          description="Current Location"
        >
          <View style={styles.busMarker}>
            <Ionicons name="bus" size={22} color="#fff" />
          </View>
        </Marker>
      )}

      {/* Stop markers */}
      {stops.map((stop) => (
        <Marker
          key={stop.id}
          coordinate={{ latitude: stop.lat, longitude: stop.lng }}
          title={stop.name}
          pinColor="#4caf50"
        />
      ))}

      {/* Route polyline */}
      {stops.length > 1 && (
        <Polyline
          coordinates={stops.map((s) => ({
            latitude: s.lat,
            longitude: s.lng,
          }))}
          strokeColor="#2196f3"
          strokeWidth={3}
        />
      )}
    </MapView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1976d2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{bus.name}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="bus" size={24} color="#2196f3" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Bus Number</Text>
              <Text style={styles.infoValue}>{bus.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="navigate" size={24} color="#4caf50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Route</Text>
              <Text style={styles.infoValue}>{bus.route}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="location" size={24} color="#ff9800" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Total Stops</Text>
              <Text style={styles.infoValue}>{stops.length} stops</Text>
            </View>
          </View>
        </View>

        {/* Map Preview */}
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.sectionTitle}>Live Location</Text>
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => setFullScreenMap(true)}
            >
              <Ionicons name="expand" size={18} color="#fff" />
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          </View>
          {renderMap(styles.map)}
        </View>

        {/* Stops List */}
        <View style={styles.stopsContainer}>
          <Text style={styles.sectionTitle}>Bus Stops</Text>
          {stops.length > 0 ? (
            stops.map((stop, index) => (
              <View key={stop.id} style={styles.stopCard}>
                <View style={styles.stopNumber}>
                  <Text style={styles.stopNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopCoords}>
                    📍 {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noStopsText}>No stops available</Text>
          )}
        </View>
      </ScrollView>

      {/* Full Screen Map Modal */}
      <Modal
        visible={fullScreenMap}
        animationType="slide"
        onRequestClose={() => setFullScreenMap(false)}
      >
        <View style={styles.fullScreenContainer}>
          {/* Full Screen Header */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              onPress={() => setFullScreenMap(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fullScreenTitle}>
              {bus.name} - Live Tracking
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Full Screen Map */}
          {renderMap(styles.fullScreenMap)}

          {/* Map Controls Overlay */}
          <View style={styles.mapOverlay}>
            <View style={styles.statusBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.statusText}>Live Tracking</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  errorText: { fontSize: 18, color: "#f44336", marginBottom: 20 },
  backButton: {
    backgroundColor: "#2196f3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 54,
    backgroundColor: "transparent",
  },
  backBtn: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1976d2" },
  infoCard: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  infoTextContainer: { marginLeft: 12, flex: 1 },
  infoLabel: { fontSize: 12, color: "#999", marginBottom: 4 },
  infoValue: { fontSize: 16, color: "#333", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 10 },
  mapContainer: { marginHorizontal: 15, marginBottom: 12 },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196f3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#2196f3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  trackButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  map: { height: 300, borderRadius: 16, overflow: "hidden" },
  busMarker: {
    backgroundColor: "#2196f3",
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
  },
  stopsContainer: { marginHorizontal: 15, marginBottom: 24 },
  stopCard: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stopNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stopNumberText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 2 },
  stopCoords: { fontSize: 12, color: "#999" },
  noStopsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  // Full Screen Map Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullScreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 54,
    backgroundColor: "#1976d2",
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
  },
  fullScreenTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 44,
  },
  fullScreenMap: {
    flex: 1,
  },
  mapOverlay: {
    position: "absolute",
    top: 110,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(33, 150, 243, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50",
    marginRight: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

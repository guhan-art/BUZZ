import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    AppState,
    Modal,
    Platform,
    RefreshControl,
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

const TRAVELLER_FALLBACK_REFRESH_INTERVAL_MS = 60000;

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

export default function TravellerBusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const busId = String(params.busId || "");
  const travellerName = String(params.travellerName || "Traveller");
  const travellerEmail = String(params.travellerEmail || "");

  const [bus, setBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fullScreenMap, setFullScreenMap] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RECONNECT_DELAY = 30000;

  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
  }, []);

  const closeSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const fetchBusDetails = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/buses/${busId}`);
      if (!res.ok) throw new Error(`Failed to fetch bus ${busId}`);
      const data: Bus = await res.json();
      setBus(data);
    } catch (e) {
      console.error("Error fetching bus details:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [busId]);

  const buildWebSocketUrl = useCallback(() => {
    const wsBaseUrl = API_BASE_URL.startsWith("https://")
      ? API_BASE_URL.replace("https://", "wss://")
      : API_BASE_URL.replace("http://", "ws://");

    return `${wsBaseUrl}/ws?busId=${encodeURIComponent(busId)}`;
  }, [busId]);

  const startAutoRefresh = useCallback(() => {
    stopAutoRefresh();
    refreshInterval.current = setInterval(
      fetchBusDetails,
      TRAVELLER_FALLBACK_REFRESH_INTERVAL_MS,
    );
  }, [fetchBusDetails, stopAutoRefresh]);

  const connectSocket = useCallback(() => {
    if (!busId) return;

    closeSocket();
    const socket = new WebSocket(buildWebSocketUrl());
    wsRef.current = socket;

    socket.onopen = () => {
      reconnectAttemptRef.current = 0;
      stopAutoRefresh(); // WS is live, no need to poll
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        if (payload?.type !== "bus-location") return;
        if (String(payload?.data?.busId) !== busId) return;
        if (typeof payload?.data?.location !== "string") return;

        setBus((previousBus) => {
          if (!previousBus) return previousBus;
          return {
            ...previousBus,
            location: payload.data.location,
          };
        });
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      startAutoRefresh(); // fallback to polling
    };

    socket.onclose = () => {
      wsRef.current = null;
      startAutoRefresh(); // fallback to polling while reconnecting
      // Auto-reconnect with exponential backoff
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttemptRef.current),
        MAX_RECONNECT_DELAY,
      );
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(connectSocket, delay);
    };
  }, [
    busId,
    buildWebSocketUrl,
    closeSocket,
    startAutoRefresh,
    stopAutoRefresh,
  ]);

  useEffect(() => {
    if (!busId) return;
    fetchBusDetails();

    if (AppState.currentState === "active") {
      connectSocket();
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        fetchBusDetails();
        connectSocket();
        return;
      }

      closeSocket();
      stopAutoRefresh();
    });

    return () => {
      closeSocket();
      stopAutoRefresh();
      subscription.remove();
    };
  }, [
    busId,
    closeSocket,
    connectSocket,
    fetchBusDetails,
    startAutoRefresh,
    stopAutoRefresh,
  ]);

  useEffect(() => {
    let mounted = true;

    const ensureLocationPermission = async () => {
      // On web, browser permission prompts are handled by the map/geolocation APIs.
      if (Platform.OS === "web") {
        if (mounted) setShowUserLocation(true);
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (mounted) {
          setShowUserLocation(status === "granted");
        }
      } catch {
        if (mounted) {
          setShowUserLocation(false);
        }
      }
    };

    ensureLocationPermission();

    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBusDetails();
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#F7FAFF", "#EFF4FF", "#F4F8FF"]}
        style={st.loadingContainer}
      >
        <ActivityIndicator size="large" color="#2C77F4" />
        <Text style={st.loadingText}>Loading your bus...</Text>
      </LinearGradient>
    );
  }

  if (!bus) {
    return (
      <LinearGradient
        colors={["#F7FAFF", "#EFF4FF", "#F4F8FF"]}
        style={st.loadingContainer}
      >
        <Ionicons name="bus-outline" size={48} color="rgba(58,83,132,0.5)" />
        <Text style={st.errorText}>Bus not found</Text>
        <TouchableOpacity style={st.retryBtn} onPress={() => router.back()}>
          <Text style={st.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Parse bus location
  const [lat, lng] =
    bus.location?.split(",").map((v) => Number(String(v).trim())) ?? [];
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

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

  const renderMap = (style: any) => (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={style}
      region={region}
      showsUserLocation={showUserLocation}
      showsMyLocationButton={showUserLocation}
    >
      {hasCoords && (
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          title={bus.name}
          description="Current Location"
          tracksViewChanges={false}
        >
          <View style={st.busMarker}>
            <Ionicons name="bus" size={22} color="#fff" />
          </View>
        </Marker>
      )}

      {stops.map((stop) => (
        <Marker
          key={stop.id}
          coordinate={{ latitude: stop.lat, longitude: stop.lng }}
          title={stop.name}
          pinColor="#38ef7d"
        />
      ))}

      {stops.length > 1 && (
        <Polyline
          coordinates={stops.map((s) => ({
            latitude: s.lat,
            longitude: s.lng,
          }))}
          strokeColor="#38ef7d"
          strokeWidth={3}
        />
      )}
    </MapView>
  );

  return (
    <View style={st.container}>
      {/* Header */}
      <LinearGradient colors={["#F7FAFF", "#EFF4FF"]} style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1B346A" />
        </TouchableOpacity>
        <View style={st.headerContent}>
          <Text style={st.headerTitle}>Your Bus</Text>
          <Text style={st.headerSubtitle}>Welcome, {travellerName}</Text>
        </View>
        <TouchableOpacity
          style={st.logoutBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="log-out-outline" size={22} color="#E2556A" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Bus Info Card */}
        <View style={st.busCard}>
          <View style={st.busCardHeader}>
            <View style={st.busIconWrap}>
              <Ionicons name="bus" size={28} color="#2C77F4" />
            </View>
            <View style={st.busCardInfo}>
              <Text style={st.busName}>{bus.name}</Text>
              <Text style={st.busRoute}>{bus.route}</Text>
            </View>
            <View style={st.liveChip}>
              <View style={st.liveDot} />
              <Text style={st.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={st.statsRow}>
            <View style={st.statItem}>
              <Ionicons name="location" size={18} color="#ff9800" />
              <Text style={st.statValue}>{stops.length}</Text>
              <Text style={st.statLabel}>Stops</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.statItem}>
              <Ionicons name="navigate" size={18} color="#4facfe" />
              <Text style={st.statValue}>
                {hasCoords ? "Active" : "Offline"}
              </Text>
              <Text style={st.statLabel}>Status</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.statItem}>
              <Ionicons name="refresh" size={18} color="#2EBD88" />
              <Text style={st.statValue}>WS</Text>
              <Text style={st.statLabel}>Realtime</Text>
            </View>
          </View>
        </View>

        {/* Map */}
        <View style={st.mapContainer}>
          <View style={st.mapHeader}>
            <Text style={st.sectionTitle}>Live Location</Text>
            <TouchableOpacity
              style={st.trackButton}
              onPress={() => setFullScreenMap(true)}
            >
              <Ionicons name="expand" size={18} color="#1B346A" />
              <Text style={st.trackButtonText}>Full Map</Text>
            </TouchableOpacity>
          </View>
          {!fullScreenMap && renderMap(st.map)}
        </View>

        {/* Stops */}
        <View style={st.stopsContainer}>
          <Text style={st.sectionTitle}>Route Stops</Text>
          {stops.length > 0 ? (
            stops.map((stop, index) => (
              <View key={stop.id} style={st.stopCard}>
                <View
                  style={[
                    st.stopNumber,
                    index === 0 && { backgroundColor: "#38ef7d" },
                    index === stops.length - 1 && {
                      backgroundColor: "#ff5858",
                    },
                  ]}
                >
                  <Text style={st.stopNumberText}>{index + 1}</Text>
                </View>
                <View style={st.stopInfo}>
                  <Text style={st.stopName}>{stop.name}</Text>
                  <Text style={st.stopCoords}>
                    {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                  </Text>
                </View>
                {index === 0 && (
                  <View style={st.stopBadge}>
                    <Text style={st.stopBadgeText}>START</Text>
                  </View>
                )}
                {index === stops.length - 1 && (
                  <View
                    style={[
                      st.stopBadge,
                      { backgroundColor: "rgba(255,88,88,0.15)" },
                    ]}
                  >
                    <Text style={[st.stopBadgeText, { color: "#ff5858" }]}>
                      END
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={st.noStopsText}>No stops available</Text>
          )}
        </View>

        {/* Traveller Info */}
        <View style={st.travellerCard}>
          <Ionicons name="person-circle-outline" size={24} color="#2C77F4" />
          <View style={st.travellerInfo}>
            <Text style={st.travellerName}>{travellerName}</Text>
            <Text style={st.travellerEmail}>{travellerEmail}</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Full Screen Map Modal */}
      <Modal
        visible={fullScreenMap}
        animationType="slide"
        onRequestClose={() => setFullScreenMap(false)}
      >
        <View style={st.fullScreenContainer}>
          <LinearGradient
            colors={["#F7FAFF", "#EFF4FF"]}
            style={st.fullScreenHeader}
          >
            <TouchableOpacity
              onPress={() => setFullScreenMap(false)}
              style={st.closeButton}
            >
              <Ionicons name="close" size={28} color="#1B346A" />
            </TouchableOpacity>
            <Text style={st.fullScreenTitle}>{bus.name} — Live Tracking</Text>
            <View style={{ width: 44 }} />
          </LinearGradient>

          {fullScreenMap && renderMap(st.fullScreenMap)}

          <View style={st.mapOverlay}>
            <View style={st.statusBadge}>
              <View style={st.liveDot} />
              <Text style={st.statusText}>Live Tracking</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFF" },

  /* Loading / Error */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { color: "#4A6290", fontSize: 16 },
  errorText: {
    color: "#4A6290",
    fontSize: 18,
    marginTop: 12,
  },
  retryBtn: {
    backgroundColor: "#2C77F4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#162B57",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(48,71,113,0.72)",
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(226,85,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(226,85,106,0.24)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Scroll */
  scroll: { flex: 1 },

  /* Bus Card */
  busCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    margin: 16,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#9DB4DA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
  },
  busCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  busIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "rgba(225,237,255,0.86)",
    justifyContent: "center",
    alignItems: "center",
  },
  busCardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  busName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#162B57",
  },
  busRoute: {
    fontSize: 13,
    color: "#4A6290",
    marginTop: 2,
  },

  /* Live chip */
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(46,189,136,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(46,189,136,0.3)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2EBD88",
    marginRight: 6,
  },
  liveText: {
    color: "#2EBD88",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(236,244,255,0.86)",
    borderRadius: 14,
    padding: 14,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#162B57",
  },
  statLabel: {
    fontSize: 11,
    color: "#4A6290",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#d8e4f7",
  },

  /* Map */
  mapContainer: { marginHorizontal: 16, marginBottom: 14 },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#162B57",
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(224,236,255,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
  },
  trackButtonText: {
    color: "#1B346A",
    fontSize: 13,
    fontWeight: "600",
  },
  map: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
  },
  busMarker: {
    backgroundColor: "#2C77F4",
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#DDEBFF",
  },

  /* Stops */
  stopsContainer: { marginHorizontal: 16, marginBottom: 16 },
  stopCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: "#9DB4DA",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
  },
  stopNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2C77F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stopNumberText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  stopInfo: { flex: 1 },
  stopName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#162B57",
    marginBottom: 2,
  },
  stopCoords: { fontSize: 11, color: "#4A6290" },
  stopBadge: {
    backgroundColor: "rgba(56,239,125,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stopBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2EBD88",
    letterSpacing: 0.5,
  },
  noStopsText: {
    fontSize: 14,
    color: "#4A6290",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 14,
  },

  /* Traveller Info */
  travellerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    shadowColor: "#9DB4DA",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
  },
  travellerInfo: { flex: 1 },
  travellerName: { fontSize: 15, fontWeight: "600", color: "#162B57" },
  travellerEmail: { fontSize: 12, color: "#4A6290", marginTop: 2 },

  /* Full Screen Map */
  fullScreenContainer: { flex: 1, backgroundColor: "#F7FAFF" },
  fullScreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  closeButton: { padding: 8 },
  fullScreenTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#162B57",
    flex: 1,
    textAlign: "center",
  },
  fullScreenMap: { flex: 1 },
  mapOverlay: {
    position: "absolute",
    top: 116,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22,43,87,0.82)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

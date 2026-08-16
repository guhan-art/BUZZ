import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from '@/src/features/bus-tracking/components/map-view';
import { API_BASE_URL } from '@/src/core/api/api';

const TRAVELLER_FALLBACK_REFRESH_INTERVAL_MS = 60000;

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

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

const StaticRouteOverlay = React.memo(({ stops }: { stops: Stop[] }) => {
  return (
    <>
      {stops.map((stop) => (
        <Marker key={stop.id} coordinate={{ latitude: stop.lat, longitude: stop.lng }} title={stop.name} />
      ))}
      {stops.length > 1 && (
        <Polyline coordinates={stops.map((s) => ({ latitude: s.lat, longitude: s.lng }))} strokeColor="#E99B16" strokeWidth={4} />
      )}
    </>
  );
});

const LiveBusMarker = React.memo(({ lat, lng, name }: { lat: number; lng: number; name: string }) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return (
    <Marker coordinate={{ latitude: lat, longitude: lng }} title={name} description="Current Location" tracksViewChanges={false}>
      <View style={st.busMarker}>
        <View style={st.busMarkerPulse} />
        <Ionicons name="bus" size={20} color="#000" />
      </View>
    </Marker>
  );
});

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
      stopAutoRefresh();
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
      startAutoRefresh();
    };

    socket.onclose = () => {
      wsRef.current = null;
      startAutoRefresh();
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

  const [lat, lng] = useMemo(() => {
    const parts = bus?.location?.split(",").map((v) => Number(String(v).trim())) ?? [];
    return [parts[0] ?? NaN, parts[1] ?? NaN];
  }, [bus?.location]);

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const region = useMemo(() => {
    return hasCoords
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
  }, [hasCoords, lat, lng]);

  const stops = useMemo(() => (Array.isArray(bus?.stops) ? bus!.stops : []), [bus?.stops]);

  if (loading) {
    return (
      <LinearGradient colors={["#000000", "#050508", "#111116"]} style={st.loadingContainer}>
        <ActivityIndicator size="large" color="#E99B16" />
        <Text style={st.loadingText}>Initializing Telemetry...</Text>
      </LinearGradient>
    );
  }

  if (!bus) {
    return (
      <LinearGradient colors={["#000000", "#050508", "#111116"]} style={st.loadingContainer}>
        <Ionicons name="bus-outline" size={48} color="rgba(255,255,255,0.5)" />
        <Text style={st.errorText}>Vehicle Not Found</Text>
        <TouchableOpacity style={st.retryBtn} onPress={() => router.back()}>
          <Text style={st.retryBtnText}>Return</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const renderMap = (style: any) => (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={style}
      region={region}
      showsUserLocation={showUserLocation}
      showsMyLocationButton={showUserLocation}
      customMapStyle={darkMapStyle}
    >
      <LiveBusMarker lat={lat} lng={lng} name={bus.name} />
      <StaticRouteOverlay stops={stops} />
    </MapView>
  );

  return (
    <View style={st.container}>
      <LinearGradient colors={["#000000", "#050508"]} style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={st.headerContent}>
          <Text style={st.headerTitle}>Vehicle Status</Text>
          <Text style={st.headerSubtitle}>Identified as {travellerName}</Text>
        </View>
        <TouchableOpacity style={st.logoutBtn} onPress={() => router.replace("/(tabs)")}>
          <Ionicons name="exit-outline" size={22} color="#FF453A" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E99B16" />}
      >
        <BlurView intensity={30} tint="dark" style={st.busCard}>
          <View style={st.busCardHeader}>
            <View style={st.busIconWrap}>
              <Ionicons name="bus" size={28} color="#E99B16" />
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
              <Ionicons name="location" size={18} color="#8A8A93" />
              <Text style={st.statValue}>{stops.length}</Text>
              <Text style={st.statLabel}>WAYPOINTS</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.statItem}>
              <Ionicons name="navigate" size={18} color="#8A8A93" />
              <Text style={[st.statValue, { color: hasCoords ? "#E99B16" : "#FF453A" }]}>{hasCoords ? "ACTIVE" : "OFFLINE"}</Text>
              <Text style={st.statLabel}>STATUS</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.statItem}>
              <Ionicons name="pulse" size={18} color="#8A8A93" />
              <Text style={st.statValue}>WS</Text>
              <Text style={st.statLabel}>DATALINK</Text>
            </View>
          </View>
        </BlurView>

        <View style={st.mapContainer}>
          <View style={st.mapHeader}>
            <Text style={st.sectionTitle}>Telemetry Visual</Text>
            <TouchableOpacity style={st.trackButton} onPress={() => setFullScreenMap(true)}>
              <Ionicons name="expand" size={18} color="#000" />
              <Text style={st.trackButtonText}>Expand</Text>
            </TouchableOpacity>
          </View>
          {!fullScreenMap && renderMap(st.map)}
        </View>

        <View style={st.stopsContainer}>
          <Text style={st.sectionTitle}>Route Manifest</Text>
          {stops.length > 0 ? (
            stops.map((stop, index) => (
              <BlurView intensity={20} tint="dark" key={stop.id} style={st.stopCard}>
                <View style={[st.stopNumber, index === 0 && { backgroundColor: "#E99B16" }, index === stops.length - 1 && { backgroundColor: "#FF453A" }]}>
                  <Text style={[st.stopNumberText, (index === 0 || index === stops.length - 1) ? { color: "#000" } : {}]}>{index + 1}</Text>
                </View>
                <View style={st.stopInfo}>
                  <Text style={st.stopName}>{stop.name}</Text>
                  <Text style={st.stopCoords}>{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</Text>
                </View>
              </BlurView>
            ))
          ) : (
            <Text style={st.noStopsText}>No route data available</Text>
          )}
        </View>

        <BlurView intensity={20} tint="dark" style={st.travellerCard}>
          <Ionicons name="finger-print-outline" size={28} color="#E99B16" />
          <View style={st.travellerInfo}>
            <Text style={st.travellerName}>{travellerName}</Text>
            <Text style={st.travellerEmail}>{travellerEmail}</Text>
          </View>
        </BlurView>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={fullScreenMap} animationType="fade" onRequestClose={() => setFullScreenMap(false)}>
        <View style={st.fullScreenContainer}>
          <LinearGradient colors={["#000000", "#050508"]} style={st.fullScreenHeader}>
            <TouchableOpacity onPress={() => setFullScreenMap(false)} style={st.closeButton}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={st.fullScreenTitle}>{bus.name}</Text>
            <View style={{ width: 44 }} />
          </LinearGradient>

          {fullScreenMap && renderMap(st.fullScreenMap)}

          <View style={st.mapOverlay}>
            <BlurView intensity={30} tint="dark" style={st.statusBadge}>
              <View style={st.liveDot} />
              <Text style={st.statusText}>LIVE TELEMETRY</Text>
            </BlurView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontFamily: "Outfit_500Medium", color: "#8A8A93", fontSize: 16 },
  errorText: { fontFamily: "Outfit_700Bold", color: "#FF453A", fontSize: 18, marginTop: 12 },
  retryBtn: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  retryBtnText: { fontFamily: "Outfit_700Bold", color: "#fff", fontSize: 15 },

  header: { flexDirection: "row", alignItems: "center", paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  headerContent: { flex: 1, marginLeft: 16 },
  headerTitle: { fontFamily: "Outfit_700Bold", fontSize: 24, color: "#FFFFFF" },
  headerSubtitle: { fontFamily: "Outfit_400Regular", fontSize: 13, color: "#8A8A93", marginTop: 2 },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,69,58,0.1)", borderWidth: 1, borderColor: "rgba(255,69,58,0.3)", justifyContent: "center", alignItems: "center" },

  scroll: { flex: 1 },

  busCard: { margin: 20, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  busCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  busIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(233,155,22,0.1)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(233,155,22,0.3)" },
  busCardInfo: { flex: 1, marginLeft: 16 },
  busName: { fontFamily: "Outfit_700Bold", fontSize: 22, color: "#FFFFFF" },
  busRoute: { fontFamily: "Outfit_400Regular", fontSize: 14, color: "#8A8A93", marginTop: 4 },
  liveChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(233,155,22,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "rgba(233,155,22,0.4)" },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E99B16", marginRight: 6 },
  liveText: { fontFamily: "Outfit_700Bold", color: "#E99B16", fontSize: 11, letterSpacing: 1 },

  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  statItem: { alignItems: "center", gap: 6 },
  statValue: { fontFamily: "Outfit_700Bold", fontSize: 16, color: "#FFFFFF" },
  statLabel: { fontFamily: "Outfit_500Medium", fontSize: 10, color: "#8A8A93", letterSpacing: 1 },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.1)" },

  mapContainer: { marginHorizontal: 20, marginBottom: 24 },
  mapHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: "Outfit_700Bold", fontSize: 18, color: "#FFFFFF", letterSpacing: 0.5 },
  trackButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#E99B16", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, gap: 6 },
  trackButtonText: { fontFamily: "Outfit_700Bold", color: "#000", fontSize: 13 },
  map: { height: 320, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  
  busMarker: { backgroundColor: "#E99B16", padding: 8, borderRadius: 20, borderWidth: 3, borderColor: "rgba(233,155,22,0.3)" },
  busMarkerPulse: { position: "absolute", top: -4, left: -4, right: -4, bottom: -4, borderRadius: 24, borderWidth: 2, borderColor: "#E99B16", opacity: 0.5 },

  stopsContainer: { marginHorizontal: 20, marginBottom: 24 },
  stopCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  stopNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center", marginRight: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  stopNumberText: { fontFamily: "Outfit_700Bold", color: "#8A8A93", fontSize: 14 },
  stopInfo: { flex: 1 },
  stopName: { fontFamily: "Outfit_700Bold", fontSize: 16, color: "#FFFFFF", marginBottom: 4 },
  stopCoords: { fontFamily: "Outfit_400Regular", fontSize: 12, color: "#55555A" },
  noStopsText: { fontFamily: "Outfit_400Regular", fontSize: 14, color: "#8A8A93", fontStyle: "italic", textAlign: "center", marginTop: 16 },

  travellerCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, padding: 20, borderRadius: 20, gap: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  travellerInfo: { flex: 1 },
  travellerName: { fontFamily: "Outfit_700Bold", fontSize: 16, color: "#FFFFFF" },
  travellerEmail: { fontFamily: "Outfit_400Regular", fontSize: 13, color: "#8A8A93", marginTop: 4 },

  fullScreenContainer: { flex: 1, backgroundColor: "#000000" },
  fullScreenHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20 },
  closeButton: { padding: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  fullScreenTitle: { fontFamily: "Outfit_700Bold", fontSize: 18, color: "#FFFFFF", flex: 1, textAlign: "center" },
  fullScreenMap: { flex: 1 },
  mapOverlay: { position: "absolute", top: 120, left: 20, right: 20, flexDirection: "row", justifyContent: "center", zIndex: 5 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  statusText: { fontFamily: "Outfit_700Bold", color: "#E99B16", fontSize: 14, letterSpacing: 1 },
});

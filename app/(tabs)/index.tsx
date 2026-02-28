import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../constants/api";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const card4Anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [busCount, setBusCount] = useState<number>(0);

  useEffect(() => {
    // Title animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    Animated.stagger(120, [
      Animated.spring(card1Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card2Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card3Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card4Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for bus icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    fetchBusCount();
  }, []);

  const fetchBusCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/buses`);
      if (response.ok) {
        const buses = await response.json();
        setBusCount(buses.length);
      }
    } catch {
      // silent
    }
  };

  const cardAnimStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1],
        }),
      },
    ],
  });

  return (
    <LinearGradient colors={["#0f0c29", "#302b63", "#24243e"]} style={st.bg}>
      {/* Decorative circles */}
      <View style={[st.circle, st.circle1]} />
      <View style={[st.circle, st.circle2]} />
      <View style={[st.circle, st.circle3]} />

      {/* Header */}
      <Animated.View
        style={[
          st.headerWrap,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={st.busEmoji}>🚍</Text>
        </Animated.View>
        <Text style={st.title}>BUZZ</Text>
        <Text style={st.subtitle}>Smart Campus Bus Tracker</Text>
        {busCount > 0 && (
          <View style={st.liveChip}>
            <View style={st.liveDot} />
            <Text style={st.liveText}>
              {busCount} {busCount === 1 ? "bus" : "buses"} active
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Cards */}
      <View style={st.cardsContainer}>
        {/* View Buses */}
        <Animated.View style={cardAnimStyle(card1Anim)}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(tabs)/buslist")}
          >
            <LinearGradient
              colors={["#11998e", "#38ef7d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.card}
            >
              <View style={st.cardIconWrap}>
                <Ionicons name="bus" size={32} color="#fff" />
              </View>
              <View style={st.cardContent}>
                <Text style={st.cardTitle}>View Buses</Text>
                <Text style={st.cardDesc}>
                  Browse routes, stops & live tracking
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color="rgba(255,255,255,0.7)"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Map */}
        <Animated.View style={cardAnimStyle(card2Anim)}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(tabs)/map")}
          >
            <LinearGradient
              colors={["#4facfe", "#00f2fe"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.card}
            >
              <View style={st.cardIconWrap}>
                <Ionicons name="map" size={32} color="#fff" />
              </View>
              <View style={st.cardContent}>
                <Text style={st.cardTitle}>Live Map</Text>
                <Text style={st.cardDesc}>
                  See buses in real-time on the map
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color="rgba(255,255,255,0.7)"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Driver */}
        <Animated.View style={cardAnimStyle(card3Anim)}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(tabs)/driverlogin")}
          >
            <LinearGradient
              colors={["#f857a6", "#ff5858"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.card}
            >
              <View style={st.cardIconWrap}>
                <Ionicons name="person" size={32} color="#fff" />
              </View>
              <View style={st.cardContent}>
                <Text style={st.cardTitle}>Driver Login</Text>
                <Text style={st.cardDesc}>
                  Share live location for your bus
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color="rgba(255,255,255,0.7)"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Admin Panel */}
        <Animated.View style={cardAnimStyle(card4Anim)}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/(tabs)/explore")}
          >
            <LinearGradient
              colors={["#f7971e", "#ffd200"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.card}
            >
              <View style={st.cardIconWrap}>
                <Ionicons name="shield-checkmark" size={32} color="#fff" />
              </View>
              <View style={st.cardContent}>
                <Text style={st.cardTitle}>Admin Panel</Text>
                <Text style={st.cardDesc}>
                  Manage buses, drivers & announcements
                </Text>
              </View>
              <View style={st.lockBadge}>
                <Ionicons name="lock-closed" size={14} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.Text style={[st.footer, { opacity: fadeAnim }]}>
        BUZZ v1.0 — SRM Bus Tracking
      </Animated.Text>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  bg: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* Decorative circles */
  circle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.08,
  },
  circle1: {
    width: 260,
    height: 260,
    backgroundColor: "#38ef7d",
    top: -60,
    right: -80,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: "#4facfe",
    bottom: 60,
    left: -80,
  },
  circle3: {
    width: 140,
    height: 140,
    backgroundColor: "#f857a6",
    top: "45%",
    right: -40,
  },

  /* Header */
  headerWrap: {
    alignItems: "center",
    marginBottom: 36,
  },
  busEmoji: {
    fontSize: 52,
    marginBottom: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 6,
    textShadowColor: "rgba(56,239,125,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56,239,125,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(56,239,125,0.3)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#38ef7d",
    marginRight: 8,
  },
  liveText: {
    color: "#38ef7d",
    fontSize: 13,
    fontWeight: "600",
  },

  /* Cards */
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  cardDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  lockBadge: {
    backgroundColor: "rgba(0,0,0,0.2)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Footer */
  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    marginTop: 16,
  },
});

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
import { fetchJsonWithCache } from "../../constants/api-cache";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnims = useRef(
    [0, 0, 0, 0].map(() => new Animated.Value(0)),
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);
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
    Animated.stagger(
      120,
      cardAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ),
    ).start();

    // Pulse animation for bus icon (captured so we can stop it)
    pulseRef.current = Animated.loop(
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
    );
    pulseRef.current.start();

    fetchBusCount();

    // Stop pulse animation on unmount to prevent CPU drain
    return () => {
      pulseRef.current?.stop();
    };
  }, []);

  const fetchBusCount = async () => {
    try {
      const buses = await fetchJsonWithCache<Array<unknown>>(
        `${API_BASE_URL}/buses`,
        { ttlMs: 120000 },
      );
      setBusCount(buses.length);
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
        {/* Traveller Login */}
        <Animated.View style={cardAnimStyle(cardAnims[0])}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/travellerlogin")}
          >
            <LinearGradient
              colors={["#11998e", "#38ef7d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.card}
            >
              <View style={st.cardIconWrap}>
                <Ionicons name="school" size={32} color="#fff" />
              </View>
              <View style={st.cardContent}>
                <Text style={st.cardTitle}>Traveller Login</Text>
                <Text style={st.cardDesc}>
                  Login with SRMIST ID to track your bus
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
        <Animated.View style={cardAnimStyle(cardAnims[1])}>
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
        <Animated.View style={cardAnimStyle(cardAnims[2])}>
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
        <Animated.View style={cardAnimStyle(cardAnims[3])}>
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

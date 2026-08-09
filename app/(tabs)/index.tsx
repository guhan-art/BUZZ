import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type ActionItem = {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  route: "/travellerlogin" | "/(tabs)/driverlogin" | "/(tabs)/explore";
  colors: [string, string];
  iconColor: string;
  locked?: boolean;
};

const ACTION_ITEMS: ActionItem[] = [
  {
    title: "Traveller Area",
    description: "Track your bus in real-time",
    icon: "location",
    route: "/travellerlogin",
    colors: ["rgba(44, 119, 244, 0.15)", "rgba(44, 119, 244, 0.05)"],
    iconColor: "#2C77F4",
  },
  {
    title: "Driver Console",
    description: "Transmit live telemetry data",
    icon: "bus",
    route: "/(tabs)/driverlogin",
    colors: ["rgba(233, 155, 22, 0.15)", "rgba(233, 155, 22, 0.05)"],
    iconColor: "#E99B16",
  },
  {
    title: "Command Center",
    description: "Admin & systems management",
    icon: "shield-checkmark",
    route: "/(tabs)/explore",
    colors: ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.02)"],
    iconColor: "#FFFFFF",
    locked: true,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isCompact = height < 760;
  const contentMaxWidth = width > 1200 ? 980 : width > 900 ? 860 : 740;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    );
    pulseRef.current.start();
    return () => pulseRef.current?.stop();
  }, [pulseAnim]);

  return (
    <LinearGradient colors={["#000000", "#050508", "#111116"]} style={st.bg}>
      {/* Glow Orbs */}
      <View style={[st.orb, st.orbTop]} />
      <View style={[st.orb, st.orbBottom]} />

      <ScrollView
        contentContainerStyle={[
          st.scrollContent,
          { paddingTop: isCompact ? 32 : 60, paddingBottom: isCompact ? 20 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[st.mainWrap, { maxWidth: contentMaxWidth }]}>
          
          {/* Header Card */}
          <MotiView from={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 800 }}>
            <BlurView intensity={30} tint="dark" style={[st.headerCard, { paddingVertical: isCompact ? 24 : 32 }]}>
              <Animated.View style={[st.logoRing, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="planet" size={32} color="#E99B16" />
              </Animated.View>

              <Text style={st.title}>BUZZ</Text>
              <Text style={st.subtitle}>SMART CAMPUS TELEMETRY</Text>
            </BlurView>
          </MotiView>

          {/* Action Cards */}
          <View style={st.cardsContainer}>
            {ACTION_ITEMS.map((item, index) => (
              <MotiView
                key={item.title}
                from={{ opacity: 0, translateY: 20, scale: 0.9 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: "spring", delay: index * 150, damping: 14 }}
              >
                <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(item.route)}>
                  <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.card, { minHeight: isCompact ? 86 : 100 }]}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    
                    <View style={[st.cardIconWrap, { borderColor: item.iconColor }]}>
                      <Ionicons name={item.icon} size={24} color={item.iconColor} />
                    </View>

                    <View style={st.cardContent}>
                      <Text style={st.cardTitle}>{item.title}</Text>
                      <Text style={st.cardDesc}>{item.description}</Text>
                    </View>

                    {item.locked ? (
                      <View style={st.lockBadge}>
                        <Ionicons name="lock-closed" size={14} color="#8A8A93" />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={24} color="#8A8A93" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>

          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 800, duration: 1000 }}>
            <Text style={st.footer}>BUZZ v2.0 - MIDNIGHT GLASS EDITION</Text>
          </MotiView>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  bg: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  mainWrap: { width: "100%", alignSelf: "center", gap: 24 },

  orb: { position: "absolute", borderRadius: 9999, opacity: 0.15 },
  orbTop: { width: 400, height: 400, top: -150, right: -150, backgroundColor: "#E99B16", filter: "blur(80px)" },
  orbBottom: { width: 350, height: 350, bottom: -150, left: -150, backgroundColor: "#2C77F4", filter: "blur(80px)" },

  headerCard: {
    alignItems: "center", borderRadius: 32, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)", overflow: "hidden",
    backgroundColor: "rgba(20,20,25,0.4)",
  },
  logoRing: {
    width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(233,155,22,0.1)", marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(233,155,22,0.3)",
  },
  title: {
    fontFamily: "Outfit_700Bold", fontSize: 44, color: "#FFFFFF",
    letterSpacing: 6, textShadowColor: "rgba(233,155,22,0.4)",
    textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 16,
  },
  subtitle: {
    fontFamily: "Outfit_500Medium", fontSize: 12, color: "#8A8A93",
    marginTop: 8, letterSpacing: 3,
  },

  cardsContainer: { gap: 16 },
  card: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
    borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  cardIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center",
    marginRight: 16, borderWidth: 1,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontFamily: "Outfit_700Bold", fontSize: 18, color: "#FFFFFF", letterSpacing: 0.5 },
  cardDesc: { fontFamily: "Outfit_400Regular", fontSize: 13, color: "#8A8A93", marginTop: 4 },
  lockBadge: {
    backgroundColor: "rgba(255,255,255,0.05)", width: 32, height: 32, borderRadius: 16,
    justifyContent: "center", alignItems: "center", marginLeft: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  footer: {
    fontFamily: "Outfit_500Medium", textAlign: "center", color: "#55555A",
    fontSize: 10, marginTop: 16, letterSpacing: 2,
  },
});

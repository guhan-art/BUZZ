import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
    title: "Traveller Login",
    description: "Login with SRMIST ID to track your bus",
    icon: "school",
    route: "/travellerlogin",
    colors: ["rgba(231,240,255,0.88)", "rgba(214,230,255,0.76)"],
    iconColor: "#1D4ED8",
  },
  {
    title: "Driver Login",
    description: "Share live location for your bus",
    icon: "person",
    route: "/(tabs)/driverlogin",
    colors: ["rgba(255,236,239,0.9)", "rgba(255,224,227,0.78)"],
    iconColor: "#BE185D",
  },
  {
    title: "Admin Panel",
    description: "Manage buses, drivers & announcements",
    icon: "shield-checkmark",
    route: "/(tabs)/explore",
    colors: ["rgba(255,247,228,0.9)", "rgba(255,237,194,0.82)"],
    iconColor: "#B45309",
    locked: true,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isCompact = height < 760;
  const contentMaxWidth = width > 1200 ? 980 : width > 900 ? 860 : 740;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnims = useRef(
    ACTION_ITEMS.map(() => new Animated.Value(0)),
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

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
          toValue: 1.08,
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

    // Stop pulse animation on unmount to prevent CPU drain
    return () => {
      pulseRef.current?.stop();
    };
  }, [cardAnims, fadeAnim, pulseAnim, slideAnim]);

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
    <LinearGradient colors={["#F7FAFF", "#EFF4FF", "#F4F8FF"]} style={st.bg}>
      <View style={[st.orb, st.orbTop]} />
      <View style={[st.orb, st.orbBottom]} />

      <ScrollView
        contentContainerStyle={[
          st.scrollContent,
          {
            paddingTop: isCompact ? 28 : 40,
            paddingBottom: isCompact ? 16 : 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[st.mainWrap, { maxWidth: contentMaxWidth }]}>
          <Animated.View
            style={[
              st.headerCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                paddingVertical: isCompact ? 18 : 24,
              },
            ]}
          >
            <Animated.View
              style={[st.logoRing, { transform: [{ scale: pulseAnim }] }]}
            >
              <LinearGradient
                colors={["#2C77F4", "#55C8F6"]}
                style={st.logoInner}
              >
                <Ionicons name="bus" size={28} color="#ffffff" />
              </LinearGradient>
            </Animated.View>

            <Text style={st.title}>BUZZ</Text>
            <Text style={st.subtitle}>Smart Campus Bus Tracker</Text>
          </Animated.View>

          <View style={st.cardsContainer}>
            {ACTION_ITEMS.map((item, index) => (
              <Animated.View
                key={item.title}
                style={cardAnimStyle(cardAnims[index])}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push(item.route)}
                >
                  <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      st.card,
                      {
                        minHeight: isCompact ? 80 : 92,
                        paddingVertical: isCompact ? 14 : 18,
                      },
                    ]}
                  >
                    <View style={st.cardIconWrap}>
                      <Ionicons
                        name={item.icon}
                        size={26}
                        color={item.iconColor}
                      />
                    </View>

                    <View style={st.cardContent}>
                      <Text style={st.cardTitle}>{item.title}</Text>
                      <Text style={st.cardDesc}>{item.description}</Text>
                    </View>

                    {item.locked ? (
                      <View style={st.lockBadge}>
                        <Ionicons name="lock-closed" size={14} color="#fff" />
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="rgba(20,36,74,0.54)"
                      />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <Animated.Text style={[st.footer, { opacity: fadeAnim }]}>
            BUZZ v1.0 - SRM Bus Tracking
          </Animated.Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  bg: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
  },

  mainWrap: {
    width: "100%",
    alignSelf: "center",
    gap: 14,
  },

  orb: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.5,
  },
  orbTop: {
    width: 360,
    height: 360,
    top: -120,
    right: -150,
    backgroundColor: "#CFE2FF",
  },
  orbBottom: {
    width: 320,
    height: 320,
    bottom: -170,
    left: -160,
    backgroundColor: "#D9F0FF",
  },

  headerCard: {
    alignItems: "center",
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(201,216,243,0.72)",
    shadowColor: "#8FA9D1",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  logoRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(228,237,255,0.92)",
    marginBottom: 8,
  },
  logoInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#13254D",
    letterSpacing: 3,
    textShadowColor: "rgba(214,227,255,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7,
    ...Platform.select({
      ios: { fontFamily: "AvenirNext-Heavy" },
      android: { fontFamily: "sans-serif-black" },
      web: { fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' },
    }),
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(48,71,113,0.78)",
    marginTop: 2,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  cardsContainer: {
    gap: 12,
    marginTop: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
    shadowColor: "#9DB4DA",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  cardIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.68)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#162B57",
    ...Platform.select({
      ios: { fontFamily: "AvenirNext-DemiBold" },
      android: { fontFamily: "sans-serif-medium" },
      web: { fontFamily: '"Segoe UI Semibold", "Trebuchet MS", sans-serif' },
    }),
  },
  cardDesc: {
    fontSize: 13,
    color: "rgba(32,53,93,0.75)",
    marginTop: 3,
  },
  lockBadge: {
    backgroundColor: "rgba(31,50,89,0.14)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  footer: {
    textAlign: "center",
    color: "rgba(58,83,132,0.65)",
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 0.4,
    paddingBottom: 2,
  },
});

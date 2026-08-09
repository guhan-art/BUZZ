import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../constants/api";

const { width } = Dimensions.get("window");

export default function TravellerLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please enter both email and password");
      shake();
      return;
    }

    // Validate SRMIST email format
    if (!trimmedEmail.endsWith("@srmist.edu.in")) {
      setError("Please use your SRMIST email (@srmist.edu.in)");
      shake();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/traveller/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Check your credentials.");
        shake();
        return;
      }

      // Navigate to traveller bus screen with bus data
      router.push({
        pathname: "/travellerbus",
        params: {
          busId: data.bus.id,
          travellerName: data.traveller.name,
          travellerEmail: data.traveller.email,
        },
      });
    } catch (e) {
      console.error("Login error:", e);
      setError("Network error. Please check your connection.");
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#F7FAFF", "#EFF4FF", "#F4F8FF"]} style={st.bg}>
      {/* Decorative circles */}
      <View style={[st.circle, st.circle1]} />
      <View style={[st.circle, st.circle2]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={st.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1B346A" />
          </TouchableOpacity>

          {/* Header */}
          <View style={st.headerWrap}>
            <View style={st.iconCircle}>
              <Ionicons name="school" size={44} color="#2A70E7" />
            </View>
            <Text style={st.title}>Traveller Login</Text>
            <Text style={st.subtitle}>
              Sign in with your SRMIST credentials
            </Text>
          </View>

          {/* Login Form */}
          <Animated.View
            style={[st.formCard, { transform: [{ translateX: shakeAnim }] }]}
          >
            {/* Email Input */}
            <View style={st.inputGroup}>
              <Text style={st.label}>SRMIST Email</Text>
              <View style={st.inputWrap}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="rgba(39,62,104,0.55)"
                  style={st.inputIcon}
                />
                <TextInput
                  style={st.input}
                  placeholder="yourname@srmist.edu.in"
                  placeholderTextColor="rgba(58,84,132,0.45)"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={st.inputGroup}>
              <Text style={st.label}>Password</Text>
              <View style={st.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="rgba(39,62,104,0.55)"
                  style={st.inputIcon}
                />
                <TextInput
                  style={[st.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(58,84,132,0.45)"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError("");
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={st.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(39,62,104,0.55)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={st.errorWrap}>
                <Ionicons name="alert-circle" size={16} color="#ff5858" />
                <Text style={st.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#2C77F4", "#55C8F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={st.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={22} color="#fff" />
                    <Text style={st.loginBtnText}>Login</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Info */}
          <View style={st.infoWrap}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="rgba(53,78,124,0.58)"
            />
            <Text style={st.infoText}>
              Use your registered SRMIST Gmail ID and password to view your
              designated bus route and live tracking.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  bg: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Decorative circles */
  circle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.48,
  },
  circle1: {
    width: 260,
    height: 260,
    backgroundColor: "#CFE2FF",
    top: -60,
    right: -80,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: "#D9F0FF",
    bottom: 60,
    left: -80,
  },

  /* Back button */
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(190,210,245,0.72)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  /* Header */
  headerWrap: {
    alignItems: "center",
    marginBottom: 36,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(217,233,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(163,191,238,0.7)",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#162B57",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(48,71,113,0.72)",
    marginTop: 6,
    textAlign: "center",
  },

  /* Form Card */
  formCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(192,211,242,0.72)",
    shadowColor: "#9DB4DA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },

  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "rgba(29,49,87,0.8)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(189,209,242,0.7)",
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#162B57",
    fontSize: 16,
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 6,
  },

  /* Error */
  errorWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,88,88,0.12)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#ff5858",
    fontSize: 13,
    flex: 1,
  },

  /* Login Button */
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    elevation: 6,
    shadowColor: "#11998e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  /* Info */
  infoWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 24,
    gap: 8,
    paddingHorizontal: 4,
  },
  infoText: {
    color: "rgba(53,78,124,0.68)",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
});

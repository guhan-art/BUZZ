import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
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
import { API_BASE_URL } from '@/src/core/api/api';
import { Colors } from '@/src/core/theme/theme';

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
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
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
    <LinearGradient colors={["#000000", "#050508", "#111116"]} style={st.bg}>
      {/* Decorative Orbs */}
      <View style={[st.orb, st.orb1]} />
      <View style={[st.orb, st.orb2]} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.scrollContent} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <Ionicons name="chevron-back" size={24} color="#F2F2F2" />
          </TouchableOpacity>

          <View style={st.headerWrap}>
            <View style={st.iconCircle}>
              <Ionicons name="planet" size={44} color="#E99B16" />
            </View>
            <Text style={st.title}>Welcome Back</Text>
            <Text style={st.subtitle}>Sign in with your SRMIST credentials</Text>
          </View>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <BlurView intensity={30} tint="dark" style={st.formCard}>
              
              <View style={st.inputGroup}>
                <Text style={st.label}>SRMIST Email</Text>
                <View style={st.inputWrap}>
                  <Ionicons name="mail" size={20} color="#8A8A93" style={st.inputIcon} />
                  <TextInput
                    style={st.input}
                    placeholder="yourname@srmist.edu.in"
                    placeholderTextColor="#55555A"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(""); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={st.inputGroup}>
                <Text style={st.label}>Password</Text>
                <View style={st.inputWrap}>
                  <Ionicons name="lock-closed" size={20} color="#8A8A93" style={st.inputIcon} />
                  <TextInput
                    style={[st.input, { flex: 1 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#55555A"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(""); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={st.eyeBtn}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#8A8A93" />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={st.errorWrap}>
                  <Ionicons name="alert-circle" size={16} color="#FF453A" />
                  <Text style={st.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity activeOpacity={0.8} onPress={handleLogin} disabled={loading} style={st.loginBtnContainer}>
                <LinearGradient colors={["#E99B16", "#FFC043"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.loginBtn}>
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Text style={st.loginBtnText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#000" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          <View style={st.infoWrap}>
            <Ionicons name="shield-checkmark" size={16} color="#8A8A93" />
            <Text style={st.infoText}>
              Secure login. Use your registered SRMIST Gmail ID to view your designated bus route and live tracking.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  bg: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.15,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: "#E99B16",
    top: -100,
    right: -100,
  },
  orb2: {
    width: 250,
    height: 250,
    backgroundColor: "#2C77F4",
    bottom: -50,
    left: -100,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    overflow: "hidden",
  },
  headerWrap: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(233,155,22,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(233,155,22,0.3)",
  },
  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 32,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: "#8A8A93",
    marginTop: 8,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(20,20,25,0.4)",
    overflow: "hidden",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: "Outfit_500Medium",
    color: "#8A8A93",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Outfit_400Regular",
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeBtn: {
    padding: 8,
  },
  errorWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,69,58,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,69,58,0.3)",
  },
  errorText: {
    fontFamily: "Outfit_500Medium",
    color: "#FF453A",
    fontSize: 13,
    flex: 1,
  },
  loginBtnContainer: {
    marginTop: 8,
    shadowColor: "#E99B16",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  loginBtnText: {
    fontFamily: "Outfit_700Bold",
    color: "#000000",
    fontSize: 16,
  },
  infoWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 32,
    gap: 12,
    paddingHorizontal: 8,
  },
  infoText: {
    fontFamily: "Outfit_400Regular",
    color: "#66666E",
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
});

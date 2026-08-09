import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

import { API_BASE_URL } from "../../constants/api";
import { adminStyles as s } from "./styles";
import { setAdminToken } from "../../constants/auth";

export function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError(true);
      setErrorText("Please enter admin password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: trimmedPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        setError(false);
        setErrorText("");
        setAdminToken(data.token);
        onUnlock();
      } else {
        setError(true);
        setErrorText("Incorrect password. Try again.");
        setPassword("");
      }
    } catch {
      setError(true);
      setErrorText("Cannot reach server. Check backend and network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#000000", "#050508", "#111116"]} style={s.passwordContainer}>
      <BlurView intensity={30} tint="dark" style={s.passwordCard}>
        <Ionicons name="shield-checkmark" size={64} color="#E99B16" />
        <Text style={s.passwordTitle}>Command Center</Text>
        <Text style={s.passwordSubtitle}>Authorized personnel only</Text>
        
        <TextInput
          style={[s.input, { width: "100%" }, error && { borderColor: "rgba(255,69,58,0.5)" }]}
          placeholder="Enter Passcode"
          placeholderTextColor="#55555A"
          secureTextEntry
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(false);
            setErrorText("");
          }}
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
        />
        
        {error && <Text style={s.errorText}>{errorText}</Text>}
        
        <TouchableOpacity
          style={[s.unlockBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <Ionicons name="lock-open" size={20} color="#000" />
              <Text style={s.unlockBtnText}>Access</Text>
            </>
          )}
        </TouchableOpacity>
      </BlurView>
    </LinearGradient>
  );
}

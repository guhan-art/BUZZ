import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

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
    <View style={s.passwordContainer}>
      <View style={s.passwordCard}>
        <Ionicons name="shield-checkmark" size={64} color="#1976d2" />
        <Text style={s.passwordTitle}>Admin Panel</Text>
        <Text style={s.passwordSubtitle}>Enter password to continue</Text>
        <TextInput
          style={[s.input, error && { borderColor: "#d32f2f" }]}
          placeholder="Password"
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
        >
          <Ionicons name="lock-open" size={20} color="#fff" />
          <Text style={s.unlockBtnText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

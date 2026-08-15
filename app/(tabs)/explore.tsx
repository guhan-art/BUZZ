import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import {
  AnnouncementSection,
  BusManager,
  DriverManager,
  PasswordGate,
  adminStyles as s,
} from '@/src/features/admin/components/ui';

export default function AdminPanelTab() {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [tab, setTab] = useState<"buses" | "drivers">("buses");

  if (!isUnlocked) {
    return <PasswordGate onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <LinearGradient colors={["#000000", "#050508", "#111116"]} style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Command Center</Text>
        <TouchableOpacity onPress={() => setIsUnlocked(false)} style={{ padding: 8 }}>
          <Ionicons name="lock-closed" size={22} color="#E99B16" />
        </TouchableOpacity>
      </View>

      {/* Announcement */}
      <AnnouncementSection />

      {/* Tab Switcher */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tabBtn, tab === "buses" && s.tabActive]}
          onPress={() => setTab("buses")}
        >
          <Ionicons name="bus" size={18} color={tab === "buses" ? "#000" : "#8A8A93"} />
          <Text style={[s.tabText, tab === "buses" && s.tabTextActive]}>Fleet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === "drivers" && s.tabActive]}
          onPress={() => setTab("drivers")}
        >
          <Ionicons name="person" size={18} color={tab === "drivers" ? "#000" : "#8A8A93"} />
          <Text style={[s.tabText, tab === "drivers" && s.tabTextActive]}>Personnel</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === "buses" ? <BusManager /> : <DriverManager />}
    </LinearGradient>
  );
}

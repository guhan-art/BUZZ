import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import {
  AnnouncementSection,
  BusManager,
  DriverManager,
  PasswordGate,
  adminStyles as s,
} from "../../components/admin";

/* ───────────── Admin Panel (coordinator) ───────────── */
export default function AdminPanelTab() {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [tab, setTab] = useState<"buses" | "drivers">("buses");

  if (!isUnlocked) {
    return <PasswordGate onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          style={{ padding: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1976d2" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Admin Panel</Text>
        <TouchableOpacity
          onPress={() => setIsUnlocked(false)}
          style={{ padding: 8 }}
        >
          <Ionicons name="lock-closed" size={22} color="#999" />
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
          <Ionicons
            name="bus"
            size={18}
            color={tab === "buses" ? "#fff" : "#1976d2"}
          />
          <Text style={[s.tabText, tab === "buses" && s.tabTextActive]}>
            Buses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === "drivers" && s.tabActive]}
          onPress={() => setTab("drivers")}
        >
          <Ionicons
            name="person"
            size={18}
            color={tab === "drivers" ? "#fff" : "#1976d2"}
          />
          <Text style={[s.tabText, tab === "drivers" && s.tabTextActive]}>
            Drivers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === "buses" ? <BusManager /> : <DriverManager />}
    </View>
  );
}

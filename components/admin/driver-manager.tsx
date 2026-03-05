import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_BASE_URL } from "../../constants/api";
import { clearCachedUrl, fetchJsonWithCache } from "../../constants/api-cache";
import { adminStyles as s } from "./styles";
import type { Bus, Driver } from "./types";

const DRIVERS_URL = `${API_BASE_URL}/admin/drivers`;
const BUSES_URL = `${API_BASE_URL}/admin/buses`;

export function DriverManager() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  // Driver modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverPhone, setDriverPhone] = useState("");
  const [driverBusId, setDriverBusId] = useState("");
  const [driverActive, setDriverActive] = useState(true);

  /* ─── Fetch ─── */
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJsonWithCache<Driver[]>(DRIVERS_URL, {
        ttlMs: 30_000,
        forceRefresh: true,
      });
      setDrivers(data);
    } catch {
      Alert.alert("Error", "Could not load drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBuses = useCallback(async () => {
    try {
      const data = await fetchJsonWithCache<Bus[]>(BUSES_URL, {
        ttlMs: 30_000,
      });
      setBuses(data);
    } catch {
      // silently fail — buses only needed for the picker
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    fetchBuses();
  }, [fetchDrivers, fetchBuses]);

  /* ─── Driver CRUD ─── */
  const openAddDriver = () => {
    setEditingDriver(null);
    setDriverPhone("");
    setDriverBusId(buses.length > 0 ? String(buses[0].id) : "");
    setDriverActive(true);
    setModalVisible(true);
  };

  const openEditDriver = (d: Driver) => {
    setEditingDriver(d);
    setDriverPhone(d.phone);
    setDriverBusId(String(d.busId));
    setDriverActive(d.isActive);
    setModalVisible(true);
  };

  const saveDriver = async () => {
    if (!driverPhone.trim() || !driverBusId.trim()) {
      Alert.alert("Error", "Phone and Bus are required");
      return;
    }
    try {
      const body = JSON.stringify({
        phone: driverPhone.trim(),
        busId: Number(driverBusId),
        isActive: driverActive,
      });
      if (editingDriver) {
        const res = await fetch(`${DRIVERS_URL}/${editingDriver.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await fetch(DRIVERS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      setModalVisible(false);
      clearCachedUrl(DRIVERS_URL);
      fetchDrivers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save driver";
      Alert.alert("Error", msg);
    }
  };

  const deleteDriver = (d: Driver) => {
    Alert.alert("Delete Driver", `Remove driver "${d.phone}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${DRIVERS_URL}/${d.id}`, { method: "DELETE" });
            clearCachedUrl(DRIVERS_URL);
            fetchDrivers();
          } catch {
            Alert.alert("Error", "Failed to delete driver");
          }
        },
      },
    ]);
  };

  const toggleDriverActive = async (d: Driver) => {
    try {
      await fetch(`${DRIVERS_URL}/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !d.isActive }),
      });
      clearCachedUrl(DRIVERS_URL);
      fetchDrivers();
    } catch {
      Alert.alert("Error", "Failed to update driver status");
    }
  };

  /* ─── Render ─── */
  const renderDriverItem = ({ item }: { item: Driver }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.phone}</Text>
          <Text style={s.cardSub}>
            Assigned to: {item.bus?.number || `Bus ID ${item.busId}`}
          </Text>
          <TouchableOpacity onPress={() => toggleDriverActive(item)}>
            <Text style={[s.statusText, item.isActive ? s.active : s.inactive]}>
              {item.isActive ? "● Active" : "● Inactive"} (tap to toggle)
            </Text>
          </TouchableOpacity>
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity
            onPress={() => openEditDriver(item)}
            style={s.iconBtn}
          >
            <Ionicons name="create-outline" size={22} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteDriver(item)}
            style={s.iconBtn}
          >
            <Ionicons name="trash-outline" size={22} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity style={s.fab} onPress={openAddDriver}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={s.fabText}>Add Driver</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1976d2"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(d) => String(d.id)}
          renderItem={renderDriverItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={s.emptyText}>
              No drivers yet. Tap &quot;Add Driver&quot; to create one.
            </Text>
          }
          onRefresh={fetchDrivers}
          refreshing={loading}
        />
      )}

      {/* Driver Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>
              {editingDriver ? "Edit Driver" : "Add Driver"}
            </Text>
            <TextInput
              style={s.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={driverPhone}
              onChangeText={setDriverPhone}
            />
            <Text style={s.inputLabel}>Assign to Bus:</Text>
            <ScrollView
              horizontal
              style={s.busPicker}
              showsHorizontalScrollIndicator={false}
            >
              {buses.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    s.busPickerItem,
                    driverBusId === String(b.id) && s.busPickerItemActive,
                  ]}
                  onPress={() => setDriverBusId(String(b.id))}
                >
                  <Text
                    style={[
                      s.busPickerText,
                      driverBusId === String(b.id) && s.busPickerTextActive,
                    ]}
                  >
                    {b.number}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={s.activeToggle}
              onPress={() => setDriverActive(!driverActive)}
            >
              <Ionicons
                name={driverActive ? "checkmark-circle" : "close-circle"}
                size={24}
                color={driverActive ? "#388e3c" : "#d32f2f"}
              />
              <Text style={{ marginLeft: 8, fontSize: 16 }}>
                {driverActive ? "Active" : "Inactive"}
              </Text>
            </TouchableOpacity>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, s.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.saveBtn]}
                onPress={saveDriver}
              >
                <Text style={s.saveBtnText}>
                  {editingDriver ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

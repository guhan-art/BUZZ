import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_BASE_URL } from "../../constants/api";
import { adminToken } from "../../constants/auth";
import { clearCachedUrl, fetchJsonWithCache } from "../../constants/api-cache";
import { adminStyles as s } from "./styles";
import type { Bus, Stop } from "./types";

const BUSES_URL = `${API_BASE_URL}/admin/buses`;

export function BusManager() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  // Bus modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [busNumber, setBusNumber] = useState("");
  const [busRoute, setBusRoute] = useState("");
  const [busLocation, setBusLocation] = useState("");

  // Stop modal
  const [stopModalVisible, setStopModalVisible] = useState(false);
  const [stopBusId, setStopBusId] = useState<number | null>(null);
  const [stopName, setStopName] = useState("");
  const [stopLat, setStopLat] = useState("");
  const [stopLng, setStopLng] = useState("");

  // Comment modal
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentBusId, setCommentBusId] = useState<number | null>(null);
  const [commentBusName, setCommentBusName] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  /* ─── Fetch ─── */
  const fetchBuses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJsonWithCache<Bus[]>(BUSES_URL, {
        ttlMs: 30_000,
        forceRefresh: true,
      });
      setBuses(data);
    } catch {
      Alert.alert("Error", "Could not load buses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  /* ─── Bus CRUD ─── */
  const openAddBus = () => {
    setEditingBus(null);
    setBusNumber("");
    setBusRoute("");
    setBusLocation("0,0");
    setModalVisible(true);
  };

  const openEditBus = (bus: Bus) => {
    setEditingBus(bus);
    setBusNumber(bus.number);
    setBusRoute(bus.route);
    setBusLocation(bus.location);
    setModalVisible(true);
  };

  const saveBus = async () => {
    if (!busNumber.trim() || !busRoute.trim()) {
      Alert.alert("Error", "Bus number and route are required");
      return;
    }
    try {
      const body = JSON.stringify({
        number: busNumber.trim(),
        route: busRoute.trim(),
        location: busLocation.trim() || "0,0",
      });
      if (editingBus) {
        const res = await fetch(`${BUSES_URL}/${editingBus.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body,
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await fetch(BUSES_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body,
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      setModalVisible(false);
      clearCachedUrl(BUSES_URL);
      fetchBuses();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save bus";
      Alert.alert("Error", msg);
    }
  };

  const deleteBus = (bus: Bus) => {
    Alert.alert(
      "Delete Bus",
      `Delete "${bus.number}"? This also removes its stops and drivers.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${BUSES_URL}/${bus.id}`, { method: "DELETE" });
              clearCachedUrl(BUSES_URL);
              fetchBuses();
            } catch {
              Alert.alert("Error", "Failed to delete bus");
            }
          },
        },
      ],
    );
  };

  /* ─── Stop CRUD ─── */
  const openAddStop = (busId: number) => {
    setStopBusId(busId);
    setStopName("");
    setStopLat("");
    setStopLng("");
    setStopModalVisible(true);
  };

  const saveStop = async () => {
    if (!stopName.trim() || !stopLat.trim() || !stopLng.trim() || !stopBusId) {
      Alert.alert("Error", "All stop fields are required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: stopName.trim(),
          lat: Number(stopLat),
          lng: Number(stopLng),
          busId: stopBusId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStopModalVisible(false);
      clearCachedUrl(BUSES_URL);
      fetchBuses();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add stop";
      Alert.alert("Error", msg);
    }
  };

  const deleteStop = (stop: Stop) => {
    Alert.alert("Delete Stop", `Remove "${stop.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${API_BASE_URL}/admin/stops/${stop.id}`, {
              method: "DELETE",
            });
            clearCachedUrl(BUSES_URL);
            fetchBuses();
          } catch {
            Alert.alert("Error", "Failed to delete stop");
          }
        },
      },
    ]);
  };

  /* ─── Comment CRUD ─── */
  const openBusComment = (bus: Bus) => {
    setCommentBusId(bus.id);
    setCommentBusName(bus.number);
    setCommentInput(bus.comment || "");
    setCommentModalVisible(true);
  };

  const saveBusComment = async () => {
    if (commentBusId === null) return;
    setSavingComment(true);
    try {
      const res = await fetch(`${BUSES_URL}/${commentBusId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
        body: JSON.stringify({ comment: commentInput.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setCommentModalVisible(false);
      clearCachedUrl(BUSES_URL);
      fetchBuses();
      Alert.alert("Success", `Comment updated for ${commentBusName}`);
    } catch {
      Alert.alert("Error", "Failed to update comment");
    } finally {
      setSavingComment(false);
    }
  };

  const clearBusComment = async () => {
    if (commentBusId === null) return;
    setSavingComment(true);
    try {
      const res = await fetch(`${BUSES_URL}/${commentBusId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
        body: JSON.stringify({ comment: "" }),
      });
      if (!res.ok) throw new Error("Failed");
      setCommentInput("");
      setCommentModalVisible(false);
      clearCachedUrl(BUSES_URL);
      fetchBuses();
      Alert.alert("Success", `Comment cleared for ${commentBusName}`);
    } catch {
      Alert.alert("Error", "Failed to clear comment");
    } finally {
      setSavingComment(false);
    }
  };

  /* ─── Render helpers ─── */
  const renderBusItem = ({ item }: { item: Bus }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.number}</Text>
          <Text style={s.cardSub}>{item.route}</Text>
          <Text style={s.cardMeta}>Location: {item.location}</Text>
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity
            onPress={() => openBusComment(item)}
            style={s.iconBtn}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="#e65100"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openEditBus(item)} style={s.iconBtn}>
            <Ionicons name="create-outline" size={22} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteBus(item)} style={s.iconBtn}>
            <Ionicons name="trash-outline" size={22} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>

      {item.comment ? (
        <TouchableOpacity
          style={s.commentBadge}
          onPress={() => openBusComment(item)}
        >
          <Ionicons name="megaphone" size={14} color="#e65100" />
          <Text style={s.commentBadgeText}>{item.comment}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Stops */}
      <View style={s.stopsSection}>
        <View style={s.stopsHeader}>
          <Text style={s.stopsTitle}>Stops ({item.stops.length})</Text>
          <TouchableOpacity
            onPress={() => openAddStop(item.id)}
            style={s.addStopBtn}
          >
            <Ionicons name="add-circle" size={18} color="#388e3c" />
            <Text style={s.addStopText}>Add</Text>
          </TouchableOpacity>
        </View>
        {item.stops.map((stop) => (
          <View key={stop.id} style={s.stopRow}>
            <Text style={s.stopName}>
              {stop.name}{" "}
              <Text style={s.stopCoords}>
                ({stop.lat.toFixed(4)}, {stop.lng.toFixed(4)})
              </Text>
            </Text>
            <TouchableOpacity onPress={() => deleteStop(stop)}>
              <Ionicons name="close-circle" size={18} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Drivers assigned */}
      {item.drivers.length > 0 && (
        <View style={s.driverBadges}>
          <Text style={{ fontSize: 12, color: "#666", marginRight: 6 }}>
            Drivers:
          </Text>
          {item.drivers.map((d) => (
            <View key={d.id} style={[s.badge, !d.isActive && s.badgeInactive]}>
              <Text style={s.badgeText}>{d.phone}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <>
      <TouchableOpacity style={s.fab} onPress={openAddBus}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={s.fabText}>Add Bus</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1976d2"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={buses}
          keyExtractor={(b) => String(b.id)}
          renderItem={renderBusItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={s.emptyText}>
              No buses yet. Tap &quot;Add Bus&quot; to create one.
            </Text>
          }
          onRefresh={fetchBuses}
          refreshing={loading}
        />
      )}

      {/* Bus Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>
              {editingBus ? "Edit Bus" : "Add Bus"}
            </Text>
            <TextInput
              style={s.input}
              placeholder="Bus Number (e.g. Bus 11)"
              value={busNumber}
              onChangeText={setBusNumber}
            />
            <TextInput
              style={s.input}
              placeholder="Route (e.g. Avadi - Porur)"
              value={busRoute}
              onChangeText={setBusRoute}
            />
            <TextInput
              style={s.input}
              placeholder="Location (lat,lng)"
              value={busLocation}
              onChangeText={setBusLocation}
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, s.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.saveBtn]}
                onPress={saveBus}
              >
                <Text style={s.saveBtnText}>
                  {editingBus ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stop Add Modal */}
      <Modal visible={stopModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Stop</Text>
            <TextInput
              style={s.input}
              placeholder="Stop Name"
              value={stopName}
              onChangeText={setStopName}
            />
            <TextInput
              style={s.input}
              placeholder="Latitude"
              keyboardType="decimal-pad"
              value={stopLat}
              onChangeText={setStopLat}
            />
            <TextInput
              style={s.input}
              placeholder="Longitude"
              keyboardType="decimal-pad"
              value={stopLng}
              onChangeText={setStopLng}
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, s.cancelBtn]}
                onPress={() => setStopModalVisible(false)}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.saveBtn]}
                onPress={saveStop}
              >
                <Text style={s.saveBtnText}>Add Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#e65100" />{" "}
              Comment for {commentBusName}
            </Text>
            <TextInput
              style={[s.input, { minHeight: 80, textAlignVertical: "top" }]}
              placeholder="Enter comment for this bus..."
              value={commentInput}
              onChangeText={setCommentInput}
              maxLength={200}
              multiline
            />
            <View style={s.modalActions}>
              {commentInput ? (
                <TouchableOpacity
                  style={[s.modalBtn, s.clearAnnouncementBtn]}
                  onPress={clearBusComment}
                  disabled={savingComment}
                >
                  <Text style={s.clearAnnouncementText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[s.modalBtn, s.cancelBtn]}
                onPress={() => setCommentModalVisible(false)}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.modalBtn,
                  s.saveBtn,
                  savingComment && { opacity: 0.6 },
                ]}
                onPress={saveBusComment}
                disabled={savingComment}
              >
                {savingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

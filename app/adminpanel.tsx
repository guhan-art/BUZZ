import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../constants/api";

/* ───────────── Types ───────────── */
interface Stop {
  id: number;
  name: string;
  lat: number;
  lng: number;
  busId: number;
}

interface Driver {
  id: number;
  phone: string;
  isActive: boolean;
  busId: number;
  bus?: { id: number; number: string };
}

interface Bus {
  id: number;
  number: string;
  route: string;
  location: string;
  stops: Stop[];
  drivers: Driver[];
}

/* ───────────── Main Component ───────────── */
export default function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<"buses" | "drivers">("buses");

  // ─── Bus state ───
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loadingBuses, setLoadingBuses] = useState(true);
  const [busModalVisible, setBusModalVisible] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [busNumber, setBusNumber] = useState("");
  const [busRoute, setBusRoute] = useState("");
  const [busLocation, setBusLocation] = useState("");

  // ─── Stop add state ───
  const [stopModalVisible, setStopModalVisible] = useState(false);
  const [stopBusId, setStopBusId] = useState<number | null>(null);
  const [stopName, setStopName] = useState("");
  const [stopLat, setStopLat] = useState("");
  const [stopLng, setStopLng] = useState("");

  // ─── Driver state ───
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverPhone, setDriverPhone] = useState("");
  const [driverBusId, setDriverBusId] = useState("");
  const [driverActive, setDriverActive] = useState(true);

  /* ─────────── Fetch helpers ─────────── */
  const fetchBuses = useCallback(async () => {
    setLoadingBuses(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/buses`);
      const data = await res.json();
      setBuses(data);
    } catch {
      Alert.alert("Error", "Could not load buses");
    } finally {
      setLoadingBuses(false);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    setLoadingDrivers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/drivers`);
      const data = await res.json();
      setDrivers(data);
    } catch {
      Alert.alert("Error", "Could not load drivers");
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  useEffect(() => {
    fetchBuses();
    fetchDrivers();
  }, [fetchBuses, fetchDrivers]);

  /* ═══════════════ BUS CRUD ═══════════════ */

  const openAddBus = () => {
    setEditingBus(null);
    setBusNumber("");
    setBusRoute("");
    setBusLocation("0,0");
    setBusModalVisible(true);
  };

  const openEditBus = (bus: Bus) => {
    setEditingBus(bus);
    setBusNumber(bus.number);
    setBusRoute(bus.route);
    setBusLocation(bus.location);
    setBusModalVisible(true);
  };

  const saveBus = async () => {
    if (!busNumber.trim() || !busRoute.trim()) {
      Alert.alert("Error", "Bus number and route are required");
      return;
    }
    try {
      if (editingBus) {
        const res = await fetch(
          `${API_BASE_URL}/admin/buses/${editingBus.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              number: busNumber.trim(),
              route: busRoute.trim(),
              location: busLocation.trim() || "0,0",
            }),
          },
        );
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await fetch(`${API_BASE_URL}/admin/buses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            number: busNumber.trim(),
            route: busRoute.trim(),
            location: busLocation.trim() || "0,0",
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      setBusModalVisible(false);
      fetchBuses();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save bus");
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
              await fetch(`${API_BASE_URL}/admin/buses/${bus.id}`, {
                method: "DELETE",
              });
              fetchBuses();
              fetchDrivers();
            } catch {
              Alert.alert("Error", "Failed to delete bus");
            }
          },
        },
      ],
    );
  };

  /* ─── Stop add/remove ─── */
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stopName.trim(),
          lat: Number(stopLat),
          lng: Number(stopLng),
          busId: stopBusId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStopModalVisible(false);
      fetchBuses();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add stop");
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
            fetchBuses();
          } catch {
            Alert.alert("Error", "Failed to delete stop");
          }
        },
      },
    ]);
  };

  /* ═══════════════ DRIVER CRUD ═══════════════ */

  const openAddDriver = () => {
    setEditingDriver(null);
    setDriverPhone("");
    setDriverBusId(buses.length > 0 ? String(buses[0].id) : "");
    setDriverActive(true);
    setDriverModalVisible(true);
  };

  const openEditDriver = (d: Driver) => {
    setEditingDriver(d);
    setDriverPhone(d.phone);
    setDriverBusId(String(d.busId));
    setDriverActive(d.isActive);
    setDriverModalVisible(true);
  };

  const saveDriver = async () => {
    if (!driverPhone.trim() || !driverBusId.trim()) {
      Alert.alert("Error", "Phone and Bus are required");
      return;
    }
    try {
      if (editingDriver) {
        const res = await fetch(
          `${API_BASE_URL}/admin/drivers/${editingDriver.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: driverPhone.trim(),
              busId: Number(driverBusId),
              isActive: driverActive,
            }),
          },
        );
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await fetch(`${API_BASE_URL}/admin/drivers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: driverPhone.trim(),
            busId: Number(driverBusId),
            isActive: driverActive,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      setDriverModalVisible(false);
      fetchDrivers();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save driver");
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
            await fetch(`${API_BASE_URL}/admin/drivers/${d.id}`, {
              method: "DELETE",
            });
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
      await fetch(`${API_BASE_URL}/admin/drivers/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !d.isActive }),
      });
      fetchDrivers();
    } catch {
      Alert.alert("Error", "Failed to update driver status");
    }
  };

  /* ═══════════════ RENDER ═══════════════ */

  const renderBusItem = ({ item }: { item: Bus }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.number}</Text>
          <Text style={s.cardSub}>{item.route}</Text>
          <Text style={s.cardMeta}>Location: {item.location}</Text>
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity onPress={() => openEditBus(item)} style={s.iconBtn}>
            <Ionicons name="create-outline" size={22} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteBus(item)} style={s.iconBtn}>
            <Ionicons name="trash-outline" size={22} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>

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
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#1976d2" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Admin Panel</Text>
      </View>

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
      {tab === "buses" ? (
        <>
          <TouchableOpacity style={s.fab} onPress={openAddBus}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={s.fabText}>Add Bus</Text>
          </TouchableOpacity>
          {loadingBuses ? (
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
                  No buses yet. Tap "Add Bus" to create one.
                </Text>
              }
              onRefresh={fetchBuses}
              refreshing={loadingBuses}
            />
          )}
        </>
      ) : (
        <>
          <TouchableOpacity style={s.fab} onPress={openAddDriver}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={s.fabText}>Add Driver</Text>
          </TouchableOpacity>
          {loadingDrivers ? (
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
                  No drivers yet. Tap "Add Driver" to create one.
                </Text>
              }
              onRefresh={fetchDrivers}
              refreshing={loadingDrivers}
            />
          )}
        </>
      )}

      {/* ═══ Bus Add/Edit Modal ═══ */}
      <Modal visible={busModalVisible} animationType="slide" transparent>
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
                onPress={() => setBusModalVisible(false)}
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

      {/* ═══ Stop Add Modal ═══ */}
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

      {/* ═══ Driver Add/Edit Modal ═══ */}
      <Modal visible={driverModalVisible} animationType="slide" transparent>
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
                onPress={() => setDriverModalVisible(false)}
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
    </View>
  );
}

/* ═══════════════ Styles ═══════════════ */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1976d2",
    marginLeft: 12,
  },

  /* Tabs */
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: "#e3eef9",
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: "#1976d2" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#1976d2", marginLeft: 6 },
  tabTextActive: { color: "#fff" },

  /* FAB */
  fab: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 15, marginLeft: 6 },

  /* Cards */
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1976d2" },
  cardSub: { fontSize: 14, color: "#555", marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#999", marginTop: 4 },
  cardActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 6 },

  /* Stops */
  stopsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  stopsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stopsTitle: { fontSize: 13, fontWeight: "bold", color: "#333" },
  addStopBtn: { flexDirection: "row", alignItems: "center" },
  addStopText: { fontSize: 13, color: "#388e3c", marginLeft: 4 },
  stopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  stopName: { fontSize: 14, color: "#333", flex: 1 },
  stopCoords: { fontSize: 12, color: "#999" },

  /* Driver badges on bus card */
  driverBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  badge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeInactive: { backgroundColor: "#fce4ec" },
  badgeText: { fontSize: 12, color: "#1976d2" },

  /* Driver card extras */
  statusText: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  active: { color: "#388e3c" },
  inactive: { color: "#d32f2f" },

  /* Empty */
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 15,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "88%",
    borderRadius: 16,
    padding: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#f9fbfd",
  },
  inputLabel: { fontSize: 14, color: "#555", marginBottom: 6 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  cancelBtn: { backgroundColor: "#eee" },
  cancelBtnText: { color: "#555", fontWeight: "600" },
  saveBtn: { backgroundColor: "#1976d2" },
  saveBtnText: { color: "#fff", fontWeight: "bold" },

  /* Bus picker for driver modal */
  busPicker: { marginBottom: 12, maxHeight: 44 },
  busPickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e3eef9",
    marginRight: 8,
  },
  busPickerItemActive: { backgroundColor: "#1976d2" },
  busPickerText: { fontSize: 14, color: "#1976d2", fontWeight: "600" },
  busPickerTextActive: { color: "#fff" },

  /* Active toggle */
  activeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 6,
  },
});

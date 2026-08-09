import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../constants/api";
import { adminToken } from "../constants/auth";

interface Bus {
  id: number;
  number: string;
  route: string;
  comment: string;
}

export default function AdminPanel() {
  const router = useRouter();

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [busComments, setBusComments] = useState<Record<number, string>>({});
  const [savingBusId, setSavingBusId] = useState<number | null>(null);

  // Global announcement
  const [globalComment, setGlobalComment] = useState("");
  const [savingGlobal, setSavingGlobal] = useState(false);

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/buses`, { headers: { "Authorization": `Bearer ${adminToken}` } });
      const data: Bus[] = await res.json();
      setBuses(data);
      const comments: Record<number, string> = {};
      data.forEach((b) => {
        comments[b.id] = b.comment || "";
      });
      setBusComments(comments);
    } catch {
      Alert.alert("Error", "Could not load buses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  // Save comment for a single bus
  const saveBusComment = async (bus: Bus) => {
    Keyboard.dismiss();
    const newComment = (busComments[bus.id] || "").trim();
    setSavingBusId(bus.id);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/buses/${bus.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
        body: JSON.stringify({ comment: newComment }),
      });
      if (!res.ok) throw new Error("Failed");
      // Update local state
      setBuses((prev) =>
        prev.map((b) => (b.id === bus.id ? { ...b, comment: newComment } : b)),
      );
      Alert.alert("Saved", `Comment updated for ${bus.number}`);
    } catch {
      Alert.alert("Error", `Failed to update comment for ${bus.number}`);
    } finally {
      setSavingBusId(null);
    }
  };

  // Clear comment for a single bus
  const clearBusComment = (bus: Bus) => {
    Alert.alert("Clear Comment", `Remove comment from ${bus.number}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setSavingBusId(bus.id);
          try {
            await fetch(`${API_BASE_URL}/admin/buses/${bus.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
              body: JSON.stringify({ comment: "" }),
            });
            setBuses((prev) =>
              prev.map((b) => (b.id === bus.id ? { ...b, comment: "" } : b)),
            );
            setBusComments((prev) => ({ ...prev, [bus.id]: "" }));
          } catch {
            Alert.alert("Error", "Failed to clear comment");
          } finally {
            setSavingBusId(null);
          }
        },
      },
    ]);
  };

  // Global: set same comment for ALL buses
  const saveGlobalComment = async () => {
    Keyboard.dismiss();
    if (!globalComment.trim()) {
      Alert.alert("Error", "Please type a comment first");
      return;
    }
    setSavingGlobal(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/announcement`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
        body: JSON.stringify({ comment: globalComment.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      // Refresh buses to show updated comments
      await fetchBuses();
      setGlobalComment("");
      Alert.alert("Done", "Comment applied to all buses!");
    } catch {
      Alert.alert("Error", "Failed to update announcement");
    } finally {
      setSavingGlobal(false);
    }
  };

  // Clear all bus comments
  const clearAllComments = () => {
    Alert.alert("Clear All", "Remove comments from ALL buses?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          setSavingGlobal(true);
          try {
            await fetch(`${API_BASE_URL}/admin/announcement`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
              body: JSON.stringify({ comment: "" }),
            });
            await fetchBuses();
            Alert.alert("Done", "All comments cleared");
          } catch {
            Alert.alert("Error", "Failed to clear comments");
          } finally {
            setSavingGlobal(false);
          }
        },
      },
    ]);
  };

  const hasCommentChanged = (bus: Bus) =>
    (busComments[bus.id] || "").trim() !== (bus.comment || "");

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1B346A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Admin Panel</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2C77F4"
          style={{ marginTop: 60 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Global Announcement */}
          <View style={s.globalCard}>
            <View style={s.globalHeader}>
              <View style={s.iconCircle}>
                <Ionicons name="megaphone" size={24} color="#B45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.globalTitle}>Announce to All Buses</Text>
                <Text style={s.globalDesc}>
                  Set the same comment for every bus at once
                </Text>
              </View>
            </View>
            <TextInput
              style={s.globalInput}
              placeholder="Type a comment for all buses..."
              placeholderTextColor="#aaa"
              value={globalComment}
              onChangeText={setGlobalComment}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              editable={!savingGlobal}
            />
            <View style={s.globalActions}>
              <TouchableOpacity
                style={s.clearAllBtn}
                onPress={clearAllComments}
                disabled={savingGlobal}
              >
                <Ionicons name="trash-outline" size={16} color="#d32f2f" />
                <Text style={s.clearAllBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.applyAllBtn,
                  (!globalComment.trim() || savingGlobal) && s.btnDisabled,
                ]}
                onPress={saveGlobalComment}
                disabled={!globalComment.trim() || savingGlobal}
              >
                {savingGlobal ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#fff" />
                    <Text style={s.applyAllBtnText}>Apply to All</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Individual Bus Cards */}
          <Text style={s.sectionTitle}>
            Individual Bus Comments ({buses.length})
          </Text>

          {buses.map((bus) => {
            const isSaving = savingBusId === bus.id;
            const changed = hasCommentChanged(bus);
            return (
              <View key={bus.id} style={s.busCard}>
                {/* Bus info */}
                <View style={s.busInfoRow}>
                  <View style={s.busIconWrap}>
                    <Ionicons name="bus" size={22} color="#2C77F4" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.busName}>{bus.number}</Text>
                    <Text style={s.busRoute}>{bus.route}</Text>
                  </View>
                  {bus.comment ? (
                    <View style={s.hasCommentBadge}>
                      <Ionicons name="chatbubble" size={12} color="#f7971e" />
                    </View>
                  ) : null}
                </View>

                {/* Current comment preview */}
                {bus.comment ? (
                  <View style={s.currentComment}>
                    <Text style={s.currentCommentLabel}>Current:</Text>
                    <Text style={s.currentCommentText}>{bus.comment}</Text>
                  </View>
                ) : null}

                {/* Comment input */}
                <TextInput
                  style={s.commentInput}
                  placeholder={
                    bus.comment
                      ? "Edit comment..."
                      : "Add a comment for this bus..."
                  }
                  placeholderTextColor="#bbb"
                  value={busComments[bus.id] || ""}
                  onChangeText={(t) =>
                    setBusComments((prev) => ({ ...prev, [bus.id]: t }))
                  }
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  editable={!isSaving}
                />

                {/* Actions */}
                <View style={s.busActions}>
                  {bus.comment ? (
                    <TouchableOpacity
                      onPress={() => clearBusComment(bus)}
                      disabled={isSaving}
                      style={s.busClearBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#d32f2f"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}
                  <TouchableOpacity
                    style={[
                      s.busSaveBtn,
                      (!changed || isSaving) && s.btnDisabled,
                    ]}
                    onPress={() => saveBusComment(bus)}
                    disabled={!changed || isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={s.busSaveBtnText}>Save</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {buses.length === 0 && (
            <Text style={s.emptyText}>No buses found</Text>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    elevation: 2,
    shadowColor: "#9DB4DA",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(188,207,238,0.75)",
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#162B57",
    marginLeft: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Global Card */
  globalCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#9DB4DA",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: "#E99B16",
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
  },
  globalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,245,228,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  globalTitle: { fontSize: 17, fontWeight: "bold", color: "#162B57" },
  globalDesc: { fontSize: 12, color: "#4A6290", marginTop: 2 },
  globalInput: {
    borderWidth: 1,
    borderColor: "#c6d7f5",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#f7faff",
    minHeight: 50,
    color: "#162B57",
    marginBottom: 12,
  },
  globalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#fce4ec",
    gap: 5,
  },
  clearAllBtnText: { color: "#d32f2f", fontWeight: "600", fontSize: 13 },
  applyAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#E99B16",
    gap: 6,
    elevation: 2,
  },
  applyAllBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  /* Section */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A4374",
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  /* Bus Card */
  busCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#9DB4DA",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 1 },
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
  },
  busInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  busIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(225,237,255,0.86)",
    justifyContent: "center",
    alignItems: "center",
  },
  busName: { fontSize: 16, fontWeight: "bold", color: "#162B57" },
  busRoute: { fontSize: 12, color: "#4A6290", marginTop: 1 },
  hasCommentBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(247,151,30,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Current comment */
  currentComment: {
    backgroundColor: "rgba(255,247,228,0.9)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#E99B16",
  },
  currentCommentLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  currentCommentText: { fontSize: 13, color: "#2A4374", lineHeight: 19 },

  /* Comment input */
  commentInput: {
    borderWidth: 1,
    borderColor: "#c6d7f5",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#f7faff",
    minHeight: 44,
    color: "#162B57",
    marginBottom: 10,
  },

  /* Bus actions */
  busActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  busClearBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fce4ec",
  },
  busSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#2C77F4",
    gap: 5,
    elevation: 2,
  },
  busSaveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },

  btnDisabled: { backgroundColor: "#b0bec5", elevation: 0 },
  emptyText: {
    textAlign: "center",
    color: "#4A6290",
    marginTop: 30,
    fontSize: 15,
  },
});

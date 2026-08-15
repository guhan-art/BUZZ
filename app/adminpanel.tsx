import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from '@/src/core/api/api';
import { adminToken } from '@/src/core/auth/auth';

interface Bus {
  id: number;
  number: string;
  route: string;
  comment: string;
}

const AdminBusCard = React.memo(({ 
  bus, 
  commentInput, 
  onCommentChange, 
  isSaving, 
  hasChanged, 
  onClear, 
  onSave 
}: { 
  bus: Bus; 
  commentInput: string; 
  onCommentChange: (text: string) => void; 
  isSaving: boolean; 
  hasChanged: boolean; 
  onClear: () => void; 
  onSave: () => void;
}) => {
  return (
    <BlurView intensity={20} tint="dark" style={s.busCard}>
      <View style={s.busInfoRow}>
        <View style={s.busIconWrap}>
          <Ionicons name="bus" size={22} color="#E99B16" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.busName}>{bus.number}</Text>
          <Text style={s.busRoute}>{bus.route}</Text>
        </View>
        {bus.comment ? (
          <View style={s.hasCommentBadge}>
            <Ionicons name="chatbox-ellipses" size={14} color="#E99B16" />
          </View>
        ) : null}
      </View>

      {bus.comment ? (
        <View style={s.currentComment}>
          <Text style={s.currentCommentLabel}>ACTIVE BROADCAST:</Text>
          <Text style={s.currentCommentText}>{bus.comment}</Text>
        </View>
      ) : null}

      <TextInput
        style={s.commentInput}
        placeholder={bus.comment ? "Update broadcast..." : "Initiate broadcast..."}
        placeholderTextColor="#55555A"
        value={commentInput}
        onChangeText={onCommentChange}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        editable={!isSaving}
      />

      <View style={s.busActions}>
        {bus.comment ? (
          <TouchableOpacity onPress={onClear} disabled={isSaving} style={s.busClearBtn}>
            <Ionicons name="trash" size={16} color="#FF453A" />
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={[s.busSaveBtn, (!hasChanged || isSaving) && s.btnDisabled]}
          onPress={onSave}
          disabled={!hasChanged || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="#000" />
              <Text style={s.busSaveBtnText}>Confirm</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </BlurView>
  );
});

export default function AdminPanel() {
  const router = useRouter();

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [busComments, setBusComments] = useState<Record<number, string>>({});
  const [savingBusId, setSavingBusId] = useState<number | null>(null);

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
      setBuses((prev) => prev.map((b) => (b.id === bus.id ? { ...b, comment: newComment } : b)));
      Alert.alert("Saved", `Comment updated for ${bus.number}`);
    } catch {
      Alert.alert("Error", `Failed to update comment for ${bus.number}`);
    } finally {
      setSavingBusId(null);
    }
  };

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
            setBuses((prev) => prev.map((b) => (b.id === bus.id ? { ...b, comment: "" } : b)));
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
      await fetchBuses();
      setGlobalComment("");
      Alert.alert("Done", "Comment applied to all buses!");
    } catch {
      Alert.alert("Error", "Failed to update announcement");
    } finally {
      setSavingGlobal(false);
    }
  };

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

  const hasCommentChanged = (bus: Bus) => (busComments[bus.id] || "").trim() !== (bus.comment || "");

  return (
    <LinearGradient colors={["#000000", "#050508", "#111116"]} style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Command Center</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#E99B16" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={buses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              <BlurView intensity={30} tint="dark" style={s.globalCard}>
                <View style={s.globalHeader}>
                  <View style={s.iconCircle}>
                    <Ionicons name="megaphone" size={24} color="#E99B16" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.globalTitle}>Global Broadcast</Text>
                    <Text style={s.globalDesc}>Transmit message to all vehicles</Text>
                  </View>
                </View>
                <TextInput
                  style={s.globalInput}
                  placeholder="Enter broadcast message..."
                  placeholderTextColor="#55555A"
                  value={globalComment}
                  onChangeText={setGlobalComment}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  editable={!savingGlobal}
                />
                <View style={s.globalActions}>
                  <TouchableOpacity style={s.clearAllBtn} onPress={clearAllComments} disabled={savingGlobal}>
                    <Ionicons name="trash" size={16} color="#FF453A" />
                    <Text style={s.clearAllBtnText}>Clear All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.applyAllBtn, (!globalComment.trim() || savingGlobal) && s.btnDisabled]}
                    onPress={saveGlobalComment}
                    disabled={!globalComment.trim() || savingGlobal}
                  >
                    {savingGlobal ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <>
                        <Ionicons name="radio-outline" size={16} color="#000" />
                        <Text style={s.applyAllBtnText}>Transmit</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </BlurView>
              <Text style={s.sectionTitle}>Fleet Status ({buses.length})</Text>
            </>
          }
          renderItem={({ item: bus }) => {
            const isSaving = savingBusId === bus.id;
            const changed = hasCommentChanged(bus);
            const handleCommentChange = (t: string) => setBusComments((prev) => ({ ...prev, [bus.id]: t }));
            return (
              <AdminBusCard
                bus={bus}
                commentInput={busComments[bus.id] || ""}
                onCommentChange={handleCommentChange}
                isSaving={isSaving}
                hasChanged={changed}
                onClear={() => clearBusComment(bus)}
                onSave={() => saveBusComment(bus)}
              />
            );
          }}
          ListEmptyComponent={<Text style={s.emptyText}>No vehicles detected</Text>}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", paddingTop: 54, paddingHorizontal: 20,
    paddingBottom: 16, backgroundColor: "rgba(5,5,8,0.8)",
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: { padding: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  headerTitle: { fontFamily: "Outfit_700Bold", fontSize: 24, color: "#FFFFFF", marginLeft: 16 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  globalCard: {
    borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1,
    borderColor: "rgba(233,155,22,0.3)", overflow: "hidden",
  },
  globalHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  iconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(233,155,22,0.1)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(233,155,22,0.3)" },
  globalTitle: { fontFamily: "Outfit_700Bold", fontSize: 18, color: "#FFFFFF" },
  globalDesc: { fontFamily: "Outfit_500Medium", fontSize: 12, color: "#8A8A93", marginTop: 4 },
  globalInput: {
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16,
    fontSize: 14, fontFamily: "Outfit_400Regular", backgroundColor: "rgba(0,0,0,0.4)", color: "#FFFFFF", marginBottom: 16, minHeight: 60,
  },
  globalActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clearAllBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "rgba(255,69,58,0.1)", gap: 6, borderWidth: 1, borderColor: "rgba(255,69,58,0.3)" },
  clearAllBtnText: { fontFamily: "Outfit_600SemiBold", color: "#FF453A", fontSize: 13 },
  applyAllBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, backgroundColor: "#E99B16", gap: 8 },
  applyAllBtnText: { fontFamily: "Outfit_700Bold", color: "#000", fontSize: 14 },

  sectionTitle: { fontFamily: "Outfit_700Bold", fontSize: 18, color: "#FFFFFF", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" },

  busCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  busInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 16 },
  busIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  busName: { fontFamily: "Outfit_700Bold", fontSize: 18, color: "#FFFFFF" },
  busRoute: { fontFamily: "Outfit_500Medium", fontSize: 13, color: "#8A8A93", marginTop: 4 },
  hasCommentBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(233,155,22,0.1)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(233,155,22,0.3)" },

  currentComment: { backgroundColor: "rgba(233,155,22,0.05)", borderRadius: 12, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: "#E99B16" },
  currentCommentLabel: { fontFamily: "Outfit_700Bold", fontSize: 10, color: "#E99B16", letterSpacing: 1, marginBottom: 4 },
  currentCommentText: { fontFamily: "Outfit_400Regular", fontSize: 14, color: "#FFFFFF", lineHeight: 20 },

  commentInput: { borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, fontSize: 14, fontFamily: "Outfit_400Regular", backgroundColor: "rgba(0,0,0,0.4)", minHeight: 50, color: "#FFFFFF", marginBottom: 16 },

  busActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  busClearBtn: { padding: 10, borderRadius: 12, backgroundColor: "rgba(255,69,58,0.1)", borderWidth: 1, borderColor: "rgba(255,69,58,0.3)" },
  busSaveBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: "#E99B16", gap: 6 },
  busSaveBtnText: { fontFamily: "Outfit_700Bold", color: "#000", fontSize: 13 },

  btnDisabled: { backgroundColor: "rgba(255,255,255,0.2)", opacity: 0.5 },
  emptyText: { fontFamily: "Outfit_400Regular", textAlign: "center", color: "#8A8A93", marginTop: 30, fontSize: 15 },
});

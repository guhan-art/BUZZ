import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_BASE_URL } from "../../constants/api";
import { adminToken } from "../../constants/auth";
import { clearCachedUrl, fetchJsonWithCache } from "../../constants/api-cache";
import { adminStyles as s } from "./styles";

export function AnnouncementSection() {
  const [announcement, setAnnouncement] = useState("");
  const [announcementInput, setAnnouncementInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    try {
      const data = await fetchJsonWithCache<{ comment?: string }>(
        `${API_BASE_URL}/admin/announcement`,
        { ttlMs: 30_000 },
      );
      setAnnouncement(data.comment || "");
      setAnnouncementInput(data.comment || "");
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  const saveAnnouncement = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/announcement`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
        body: JSON.stringify({ comment: announcementInput.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      clearCachedUrl(`${API_BASE_URL}/admin/announcement`);
      setAnnouncement(announcementInput.trim());
      Alert.alert("Success", "Announcement updated for all buses!");
    } catch {
      Alert.alert("Error", "Failed to update announcement");
    } finally {
      setSaving(false);
    }
  };

  const clearAnnouncement = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/announcement`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
        body: JSON.stringify({ comment: "" }),
      });
      if (!res.ok) throw new Error("Failed");
      clearCachedUrl(`${API_BASE_URL}/admin/announcement`);
      setAnnouncement("");
      setAnnouncementInput("");
      Alert.alert("Success", "Announcement cleared for all buses!");
    } catch {
      Alert.alert("Error", "Failed to clear announcement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.announcementSection}>
      <Text style={s.announcementLabel}>
        <Ionicons name="megaphone" size={16} color="#e65100" /> Announcement for
        all buses
      </Text>
      <View style={s.announcementRow}>
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Enter announcement text..."
          value={announcementInput}
          onChangeText={setAnnouncementInput}
          maxLength={200}
        />
      </View>
      <View style={s.announcementActions}>
        {announcement ? (
          <TouchableOpacity
            style={s.clearAnnouncementBtn}
            onPress={clearAnnouncement}
            disabled={saving}
          >
            <Text style={s.clearAnnouncementText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[s.saveAnnouncementBtn, saving && { opacity: 0.6 }]}
          onPress={saveAnnouncement}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.saveAnnouncementText}>Apply to All Buses</Text>
          )}
        </TouchableOpacity>
      </View>
      {announcement ? (
        <Text style={s.currentAnnouncement}>
          Current: &quot;{announcement}&quot;
        </Text>
      ) : null}
    </View>
  );
}

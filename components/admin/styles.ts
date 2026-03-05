import { StyleSheet } from "react-native";

/* ───────────── Shared admin styles ───────────── */
export const adminStyles = StyleSheet.create({
  /* Password gate */
  passwordContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  passwordCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  passwordTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1976d2",
    marginTop: 16,
  },
  passwordSubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
    marginBottom: 24,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 13,
    marginBottom: 8,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1976d2",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  unlockBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },

  /* Main container */
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
    flex: 1,
    fontSize: 22,
    fontWeight: "bold",
    color: "#1976d2",
    marginLeft: 12,
  },

  /* Announcement */
  announcementSection: {
    backgroundColor: "#fff8e1",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ffe0b2",
  },
  announcementLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e65100",
    marginBottom: 8,
  },
  announcementRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  announcementActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  saveAnnouncementBtn: {
    backgroundColor: "#e65100",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveAnnouncementText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  clearAnnouncementBtn: {
    backgroundColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearAnnouncementText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 13,
  },
  currentAnnouncement: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
    fontStyle: "italic",
  },

  /* Comment badge on bus card */
  commentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  commentBadgeText: {
    fontSize: 13,
    color: "#e65100",
    marginLeft: 6,
    flex: 1,
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
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1976d2",
    marginLeft: 6,
  },
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
  fabText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },

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
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
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

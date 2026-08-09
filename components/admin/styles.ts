import { StyleSheet } from "react-native";

/* ───────────── Shared admin styles ───────────── */
export const adminStyles = StyleSheet.create({
  /* Password gate */
  passwordContainer: {
    flex: 1,
    backgroundColor: "#F7FAFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  passwordCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    elevation: 4,
    shadowColor: "#9DB4DA",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
  },
  passwordTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#162B57",
    marginTop: 16,
  },
  passwordSubtitle: {
    fontSize: 14,
    color: "#4A6290",
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
    backgroundColor: "#2C77F4",
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
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "bold",
    color: "#162B57",
    marginLeft: 12,
  },

  /* Announcement */
  announcementSection: {
    backgroundColor: "rgba(255,247,228,0.9)",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(241,203,131,0.65)",
  },
  announcementLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#B45309",
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
    backgroundColor: "#E99B16",
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
    color: "#4A6290",
    fontWeight: "600",
    fontSize: 13,
  },
  currentAnnouncement: {
    fontSize: 12,
    color: "#4A6290",
    marginTop: 6,
    fontStyle: "italic",
  },

  /* Comment badge on bus card */
  commentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,245,228,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  commentBadgeText: {
    fontSize: 13,
    color: "#B45309",
    marginLeft: 6,
    flex: 1,
  },

  /* Tabs */
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: "rgba(225,237,255,0.86)",
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
  tabActive: { backgroundColor: "#2C77F4" },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1B346A",
    marginLeft: 6,
  },
  tabTextActive: { color: "#fff" },

  /* FAB */
  fab: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#2C77F4",
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
    backgroundColor: "rgba(255,255,255,0.9)",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: "#9DB4DA",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(188,207,238,0.75)",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#162B57" },
  cardSub: { fontSize: 14, color: "#2A4374", marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#4A6290", marginTop: 4 },
  cardActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 6 },

  /* Stops */
  stopsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#d8e4f7",
  },
  stopsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stopsTitle: { fontSize: 13, fontWeight: "bold", color: "#162B57" },
  addStopBtn: { flexDirection: "row", alignItems: "center" },
  addStopText: { fontSize: 13, color: "#2EBD88", marginLeft: 4 },
  stopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  stopName: { fontSize: 14, color: "#162B57", flex: 1 },
  stopCoords: { fontSize: 12, color: "#4A6290" },

  /* Driver badges on bus card */
  driverBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#d8e4f7",
  },
  badge: {
    backgroundColor: "rgba(225,237,255,0.86)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeInactive: { backgroundColor: "#fce4ec" },
  badgeText: { fontSize: 12, color: "#1B346A" },

  /* Driver card extras */
  statusText: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  active: { color: "#388e3c" },
  inactive: { color: "#d32f2f" },

  /* Empty */
  emptyText: {
    textAlign: "center",
    color: "#4A6290",
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
    backgroundColor: "rgba(255,255,255,0.95)",
    width: "88%",
    borderRadius: 16,
    padding: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#162B57",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#c6d7f5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#f7faff",
  },
  inputLabel: { fontSize: 14, color: "#2A4374", marginBottom: 6 },
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
  saveBtn: { backgroundColor: "#2C77F4" },
  saveBtnText: { color: "#fff", fontWeight: "bold" },

  /* Bus picker for driver modal */
  busPicker: { marginBottom: 12, maxHeight: 44 },
  busPickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(225,237,255,0.86)",
    marginRight: 8,
  },
  busPickerItemActive: { backgroundColor: "#2C77F4" },
  busPickerText: { fontSize: 14, color: "#1B346A", fontWeight: "600" },
  busPickerTextActive: { color: "#fff" },

  /* Active toggle */
  activeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 6,
  },
});

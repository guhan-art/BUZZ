import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Example bus data with busNumber and busReg
const busData = [
  {
    id: "1",
    name: "Bus 11",
    busNumber: "11",
    busReg: "TN 19 XX XXXX",
    stops: ["Avadi", "Decathalon Service Road", "Porur Toll Gate"],
  },
  {
    id: "2",
    name: "Bus 33",
    busNumber: "33",
    busReg: "TN 19 YY YYYY",
    stops: [
      "Avichi School",
      "Mega Mart",
      "Vembuliamman Kovil",
      "Kesavarthini",
      "Valasaravakkam",
      "Butt Road",
      "Tambaram Hindu Mission",
    ],
  },
  {
    id: "3",
    name: "Bus 33B",
    busNumber: "33B",
    busReg: "TN 19 CC CCCC",
    stops: [
      "Porur Roundana",
      "Sakthi Nagar(Saravana Stores)",
      "Mugalivakkam",
      "Ramapuram(MIOT)",
    ],
  },
  {
    id: "4",
    name: "Bus 11B",
    busNumber: "11B",
    busReg: "TN 19 AA AAAA",
    stops: ["Waves", "Collector Nagar", "Golden Flats"],
  },
  {
    id: "5",
    name: "Bus 11C",
    busNumber: "11C",
    busReg: "TN 19 BB BBBB",
    stops: [
      "VGN Apartments",
      "Thirumullaivayol",
      "Saraswathi Nagar",
      "Dunlop",
      "Ambattur Estate",
      "Wavin",
    ],
  },
  // Add more buses as needed
];

export default function YourBus() {
  const [input, setInput] = useState("");
  const [searched, setSearched] = useState(false);

  // Find bus by entered number (case-insensitive)
  const bus = busData.find(
    (b) => b.busNumber.toLowerCase() === input.trim().toLowerCase()
  );

  const handleSearch = () => {
    setSearched(true);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚌 Your Bus</Text>

      <View style={styles.inputCard}>
        <Text style={styles.sectionTitle}>Enter Your Bus Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 11, 33, 3tc"
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          keyboardType="default"
        />
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.buttonText}>Show My Bus</Text>
        </TouchableOpacity>
      </View>

      {searched && (
        bus ? (
          <View style={styles.detailsCard}>
            <Text style={styles.busName}>{bus.name}</Text>
            <Text style={styles.busNumber}>Bus Number: {bus.busNumber}</Text>
            <Text style={{ fontSize: 15, color: "#888", marginBottom: 8 }}>
              Registration: {bus.busReg}
            </Text>
            <View style={styles.routeCard}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Ionicons name="map" size={20} color="#1976d2" style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Route</Text>
              </View>
              {bus.stops.map((stop, idx) => (
                <View key={stop} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Ionicons
                    name={idx === 0 ? "ellipse" : idx === bus.stops.length - 1 ? "flag" : "radio-button-on"}
                    size={16}
                    color={idx === 0 ? "#388e3c" : idx === bus.stops.length - 1 ? "#d32f2f" : "#1976d2"}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ fontSize: 16, color: "#444" }}>{stop}</Text>
                </View>
              ))}
            </View>
            {/* Placeholder for map */}
            <View style={{ marginTop: 18, alignItems: "center" }}>
              <Ionicons name="map-outline" size={60} color="#1976d2" />
              <Text style={{ color: "#888", marginTop: 6 }}>Map coming soon...</Text>
            </View>
          </View>
        ) : (
          <View style={styles.detailsCard}>
            <Text style={{ color: "#d32f2f", fontSize: 16 }}>
              No bus found for "{input.trim()}".
            </Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 24,
    alignSelf: "center",
  },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1976d2",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#f0f4fa",
    color: "#1976d2",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  busName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 4,
  },
  busNumber: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
  routeCard: {
    marginTop: 8,
    marginBottom: 8,
  },
});

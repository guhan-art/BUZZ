import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Initial bus data with all fields
const initialBusData = [
  {
    id: "1",
    name: "Bus 11",
    busNumber: "11",
    busReg: "TN 19 XX XXXX",
    route: "Avadi - Porur Toll Gate",
    departureTime: "8:00 AM",
    stops: ["Avadi", "Decathalon Service Road", "Porur Toll Gate"],
  },
  {
    id: "2",
    name: "Bus 33",
    busNumber: "33",
    busReg: "TN 19 YY YYYY",
    route: "Avichi School - Tambaram Hindu Mission",
    departureTime: "8:15 AM",
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
    busReg: "TN 19 ZZ ZZZZ",
    route: "Porur Roundana - Ramapuram(MIOT)",
    departureTime: "8:30 AM",
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
    route: "Waves - Golden Flats",
    departureTime: "8:45 AM",
    stops: ["Waves", "Collector Nagar", "Golden Flats"],
  },
  {
    id: "5",
    name: "Bus 11C",
    busNumber: "11C",
    busReg: "TN 19 BB BBBB",
    route: "VGN Apartments - Wavin",
    departureTime: "9:00 AM",
    stops: [
      "VGN Apartments",
      "Thirumullaivayol",
      "Saraswathi Nagar",
      "Dunlop",
      "Ambattur Estate",
      "Wavin",
    ],
  },
];

export default function AdminPanel() {
  const [busData, setBusData] = useState(initialBusData);
  const [name, setName] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [busReg, setBusReg] = useState("");
  const [route, setRoute] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [stops, setStops] = useState("");

  const addBus = () => {
    if (!name || !busNumber || !busReg || !route || !departureTime || !stops) {
      Alert.alert("Please fill all fields");
      return;
    }
    setBusData([
      ...busData,
      {
        id: (busData.length + 1).toString(),
        name,
        busNumber,
        busReg,
        route,
        departureTime,
        stops: stops.split(",").map((s) => s.trim()),
      },
    ]);
    setName("");
    setBusNumber("");
    setBusReg("");
    setRoute("");
    setDepartureTime("");
    setStops("");
  };

  const removeBus = (id: string) => {
    setBusData(busData.filter((bus) => bus.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠️ Admin Panel</Text>

      {/* Add Bus Form */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add New Bus</Text>
        <TextInput
          style={styles.input}
          placeholder="Bus Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Bus Number"
          value={busNumber}
          onChangeText={setBusNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Registration Number"
          value={busReg}
          onChangeText={setBusReg}
        />
        <TextInput
          style={styles.input}
          placeholder="Route"
          value={route}
          onChangeText={setRoute}
        />
        <TextInput
          style={styles.input}
          placeholder="Departure Time"
          value={departureTime}
          onChangeText={setDepartureTime}
        />
        <TextInput
          style={styles.input}
          placeholder="Stops (comma separated)"
          value={stops}
          onChangeText={setStops}
        />
        <TouchableOpacity style={styles.button} onPress={addBus}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Add Bus</Text>
        </TouchableOpacity>
      </View>

      {/* Bus List */}
      <Text style={styles.sectionTitle}>Bus List</Text>
      <FlatList
        data={busData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.busCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.busName}>{item.name}</Text>
              <Text style={styles.busRoute}>{item.route}</Text>
              <Text style={styles.busTime}>Departure: {item.departureTime}</Text>
              <Text style={{ color: "#888", fontSize: 13 }}>
                Bus Number: {item.busNumber}
              </Text>
              <Text style={{ color: "#888", fontSize: 13 }}>
                Registration: {item.busReg}
              </Text>
              <Text style={{ color: "#888", fontSize: 13 }}>
                Stops: {item.stops.join(", ")}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeBus(item.id)}>
              <Ionicons name="trash" size={24} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: "#888", textAlign: "center", marginTop: 20 }}>
            No buses available.
          </Text>
        }
      />
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
  formCard: {
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
  busCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  busName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976d2",
  },
  busRoute: {
    fontSize: 15,
    color: "#555",
  },
  busTime: {
    fontSize: 14,
    color: "#388e3c",
  },
});
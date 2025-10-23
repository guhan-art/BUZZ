import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";

export default function MapScreen() {
  const chennaiRegion: Region = {
    latitude: 13.0827,
    longitude: 80.2707,
    latitudeDelta: 0.3,
    longitudeDelta: 0.3,
  };

  const [region, setRegion] = useState<Region>(chennaiRegion);
  const [hasLocation, setHasLocation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Showing Chennai on the map.");
          return; // keep Chennai fallback
        }

        const pos = await Location.getCurrentPositionAsync({});
        const next: Region = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(next);
        setHasLocation(true);
      } catch (error) {
        console.error("Error getting location:", error);
        Alert.alert("Error", "Could not get your location. Showing Chennai.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        followsUserLocation
      >
        {hasLocation && (
          <Marker
            coordinate={{ latitude: region.latitude, longitude: region.longitude }}
            title="You are here"
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
});
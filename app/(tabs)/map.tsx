import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function BusLiveMap({ busId }) {
  const [bus, setBus] = useState(null);

  useEffect(() => {
    const fetchLocation = () => {
      fetch(`http://10.187.157.225:5000/buses/${busId}`)
        .then((res) => res.json())
        .then(setBus)
        .catch(console.error);
    };
    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [busId]);

  if (!bus) return <Text style={{ textAlign: "center", marginTop: 50 }}>Loading...</Text>;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: bus.latitude ?? 13.0827,
          longitude: bus.longitude ?? 80.2707,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: bus.latitude ?? 13.0827,
            longitude: bus.longitude ?? 80.2707,
          }}
          title={bus.name}
          description="Live bus location"
        />
      </MapView>
    </View>
  );
}

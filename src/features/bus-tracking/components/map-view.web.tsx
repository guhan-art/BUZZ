/**
 * Web fallback for react-native-maps.
 *
 * react-native-maps uses native-only APIs and cannot run on web.
 * This module provides lightweight stand-ins so the rest of the app
 * compiles and renders a useful placeholder on web.
 */
import React from "react";
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/* ---------- Types ---------- */

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapViewProps {
  style?: any;
  initialRegion?: Region;
  children?: React.ReactNode;
  [key: string]: any;
}

interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  pinColor?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

interface PolylineProps {
  coordinates: { latitude: number; longitude: number }[];
  strokeColor?: string;
  strokeWidth?: number;
  [key: string]: any;
}

/* ---------- Constants ---------- */

export const PROVIDER_GOOGLE = "google" as const;

/* ---------- Components ---------- */

/** A simple placeholder that replaces MapView on web. */
export function MapView({ style, initialRegion, children }: MapViewProps) {
  const lat = initialRegion?.latitude ?? 0;
  const lng = initialRegion?.longitude ?? 0;

  const openInMaps = () => {
    const url = `https://www.google.com/maps/@${lat},${lng},14z`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.emoji}>🗺️</Text>
      <Text style={styles.title}>Map Preview</Text>
      <Text style={styles.subtitle}>
        Maps are not supported on web.{"\n"}
        Use the mobile app for full map functionality.
      </Text>
      {initialRegion && (
        <Text style={styles.coords}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </Text>
      )}
      <TouchableOpacity style={styles.button} onPress={openInMaps}>
        <Text style={styles.buttonText}>Open in Google Maps</Text>
      </TouchableOpacity>
      {/* Render children so Marker / Polyline JSX doesn't cause errors */}
      <View style={styles.hidden}>{children}</View>
    </View>
  );
}

/** Marker is a no-op on web (rendered inside MapView's hidden wrapper). */
export function Marker(_props: MarkerProps) {
  return null;
}

/** Polyline is a no-op on web. */
export function Polyline(_props: PolylineProps) {
  return null;
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e8f0fe",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    overflow: "hidden",
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  coords: { fontSize: 13, color: "#999", marginBottom: 12 },
  button: {
    backgroundColor: "#2196f3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  hidden: { display: "none" },
});

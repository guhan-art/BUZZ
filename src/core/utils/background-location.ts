import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { API_BASE_URL } from '@/src/core/api/api';

const BACKGROUND_LOCATION_TASK = "background-location-task";

let _activeBusId: string | null = null;

/**
 * TaskManager callback — runs even when the app is backgrounded.
 * Receives a batch of locations and POSTs the latest one to the server.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[BG Location] Task error:", error.message);
    return;
  }

  const busId = _activeBusId;
  if (!busId) return;

  const locations = (data as { locations?: Location.LocationObject[] })
    ?.locations;
  if (!locations || locations.length === 0) return;

  const latest = locations[locations.length - 1];

  // Fire-and-forget POST (we're in background, can't do much on failure)
  fetch(`${API_BASE_URL}/driver/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      busId,
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
    }),
  }).catch((e) => console.error("[BG Location] POST failed:", e));
});

/**
 * Request background location permission and start background tracking.
 * Call this AFTER the user has already granted foreground permission.
 */
export async function startBackgroundLocation(busId: string): Promise<boolean> {
  // Check / request background permission
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== "granted") {
    console.warn("[BG Location] Background permission denied");
    return false;
  }

  _activeBusId = busId;

  const isRunning = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  ).catch(() => false);

  if (!isRunning) {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 30, // metres
      timeInterval: 15_000, // ms
      deferredUpdatesInterval: 15_000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "BUZZ — Sharing Location",
        notificationBody: `Tracking Bus ${busId}`,
        notificationColor: "#1976d2",
      },
    });
  }

  return true;
}

/**
 * Stop background location tracking.
 */
export async function stopBackgroundLocation(): Promise<void> {
  _activeBusId = null;

  const isRunning = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  ).catch(() => false);

  if (isRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

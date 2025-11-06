# Location Update Optimization Plan

This document reviews the current location tracking flow and proposes an improved architecture that keeps UI behaviour intact while minimising battery drain on driver devices.

## Current Behaviour

- **Passenger map (`app/(tabs)/map.tsx`)**

  - Requests foreground permission on mount and calls `Location.getCurrentPositionAsync({})` a single time.
  - Stores the coordinates in React state but renders the `MapView` using `initialRegion`, so subsequent state changes do not re-centre the map.

- **Driver sharing (`app/(tabs)/driverlogin.tsx`)**
  - Requests foreground permission after a successful login.
  - Starts a `setInterval` that every 5 seconds calls `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })` and POSTs the coordinates to `/driver/location`.
  - The interval runs forever while the screen is open, even if the driver is stationary or the network request fails, and it does not support background updates.

### Battery Impact

- `getCurrentPositionAsync` wakes the GPS from cold start each invocation, which is expensive compared with a persistent watcher.
- `Accuracy.High` forces GNSS lock even when coarse accuracy would suffice.
- A fixed 5-second polling cadence generates unnecessary network chatter while idle.

## Recommended Architecture

### 1. Centralised Location Service Hook

Create `hooks/use-driver-location.ts` that encapsulates permission flow, watcher lifecycle, throttling, and cleanup.

```ts
export function useDriverLocation(busId: string | null) {
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentRef = useRef<{
    timestamp: number;
    coords: Location.LocationObject["coords"];
  } | null>(null);

  const start = useCallback(async () => {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== "granted") throw new Error("foreground-denied");

    // Optional: request background when you later enable TaskManager support
    // const { status: bg } = await Location.requestBackgroundPermissionsAsync();

    watcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50, // Only wake when driver moved 50 metres
        timeInterval: 15000, // Or every 15 seconds at most
        mayShowUserSettingsDialog: true,
      },
      (location) => {
        sendToServerIfChanged(location);
      }
    );

    setStatus("running");
  }, [busId]);

  const stop = useCallback(() => {
    watcherRef.current?.remove();
    watcherRef.current = null;
    setStatus("idle");
  }, []);

  return { status, start, stop };
}
```

### 2. Intelligent Server Updates

- Maintain the last sent coordinate + timestamp.
- Use a lightweight distance function (e.g., Haversine) to skip uploads when movement is < 25 m.
- Enforce a minimum time gap (e.g., 10–15 s) even if the distance threshold is crossed to avoid rapid-fire updates.
- Batch retries with exponential backoff on network failure instead of hammering every loop.

```ts
function sendToServerIfChanged(location: Location.LocationObject) {
  const { latitude, longitude } = location.coords;
  const now = Date.now();
  const last = lastSentRef.current;

  if (last) {
    const moved = getDistance(last.coords, location.coords); // metres
    const elapsed = now - last.timestamp;
    if (moved < 25 && elapsed < 15000) return; // Skip insignificant changes
  }

  postLocation(busId, latitude, longitude)
    .then(() => {
      lastSentRef.current = { timestamp: now, coords: location.coords };
    })
    .catch(() => queueRetry(busId, location));
}
```

### 3. Background-Friendly Option (Future)

For fully resilient tracking (screen closed), swap `watchPositionAsync` for `startLocationUpdatesAsync` paired with Expo TaskManager:

```ts
await Location.startLocationUpdatesAsync(BUZZ_TRACKING_TASK, {
  accuracy: Location.Accuracy.Balanced,
  distanceInterval: 50,
  timeInterval: 15000,
  foregroundService: {
    notificationTitle: "BUZZ",
    notificationBody: "Sharing your live location",
  },
  pausesUpdatesAutomatically: true, // iOS battery saver
  activityType: Location.ActivityType.AutomotiveNavigation,
});
```

In the TaskManager handler, send the update using the same throttling logic.

### 4. Passenger Map Improvements

- Switch `MapView` to use controlled `region={region}` and optionally `animateToRegion` when the driver moves.
- Expose a refresh interval or subscribe to driver location updates via websockets/SSE to avoid manual reloads.

### 5. Accuracy Strategy

- Default to `Accuracy.Balanced` (coarse ~100 m) while the bus is en route; upgrade to `Accuracy.High` only when the driver taps "start trip" or when speed > 10 km/h.
- Enable `pausesUpdatesAutomatically: true` (iOS) so the OS suspends updates when the device is stationary for an extended period.

### 6. Cleanup and UX

- Ensure `stop()` runs on logout and when the component unmounts to avoid rogue watchers.
- Show a persistent indicator informing drivers that location sharing is active; use Android foreground service + iOS status bar indicator.
- Handle permission denial gracefully and fall back to manual updates.

## Implementation Checklist

- [x] Create `hooks/use-driver-location.ts` with watcher + throttling.
- [x] Replace interval logic in `driverlogin.tsx` with the new hook.
- [x] Add distance/time gating to reduce uploads.
- [x] Optional: integrate TaskManager for background updates.
- [ ] Adjust `MapView` usage to respond to updated coordinates.
- [ ] Update documentation (README / driver instructions) to reflect permission requirements.

Adopting this plan reduces GPS wakeups, network calls, and CPU usage while paving the way for background tracking that meets platform requirements.

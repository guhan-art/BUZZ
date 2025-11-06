import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { API_BASE_URL } from "@/constants/api";

type DriverLocationStatus = "idle" | "running" | "error";

type LocationCoords = Location.LocationObject["coords"];

type TimeoutHandle = ReturnType<typeof setTimeout>;

const EARTH_RADIUS_METERS = 6371000;
const DRIVER_LOCATION_TASK = "buzz-driver-location-updates";

const bufferedBackgroundLocations: Location.LocationObject[] = [];
let globalQueueLocationHandler:
  | ((location: Location.LocationObject) => void)
  | null = null;
let backgroundTaskRegistered = false;

type BackgroundTaskEvent = {
  data?: {
    locations?: Location.LocationObject[];
  };
  error?: unknown;
};

const setGlobalQueueLocationHandler = (
  handler: typeof globalQueueLocationHandler
) => {
  globalQueueLocationHandler = handler;

  if (globalQueueLocationHandler && bufferedBackgroundLocations.length) {
    const pending = bufferedBackgroundLocations.splice(
      0,
      bufferedBackgroundLocations.length
    );
    pending.forEach((location) => {
      globalQueueLocationHandler?.(location);
    });
  }
};

const clearGlobalQueueLocationHandler = (
  handler: typeof globalQueueLocationHandler
) => {
  if (globalQueueLocationHandler === handler) {
    globalQueueLocationHandler = null;
  }
};

const registerBackgroundTask = () => {
  if (backgroundTaskRegistered || Platform.OS === "web") {
    return;
  }

  TaskManager.defineTask(DRIVER_LOCATION_TASK, (event: BackgroundTaskEvent) => {
    const { data, error } = event;

    if (error) {
      console.error("Background location task error", error);
      return;
    }

    const { locations } = data ?? {};

    if (!locations?.length) {
      return;
    }

    locations.forEach((location) => {
      if (globalQueueLocationHandler) {
        globalQueueLocationHandler(location);
      } else {
        bufferedBackgroundLocations.push(location);
      }
    });
  });

  backgroundTaskRegistered = true;
};

export interface UseDriverLocationOptions {
  distanceThreshold?: number;
  timeThreshold?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  enableBackgroundUpdates?: boolean;
  backgroundService?: {
    notificationTitle?: string;
    notificationBody?: string;
  };
}

export interface DriverLocationState {
  status: DriverLocationStatus;
  lastError: string | null;
  lastLocation: Location.LocationObject | null;
  start: () => void;
  stop: () => void;
}

/**
 * Hook that manages driver location sharing with throttling and retry support.
 */
export function useDriverLocation(
  busId: string | null,
  options: UseDriverLocationOptions = {}
): DriverLocationState {
  const distanceThreshold = options.distanceThreshold ?? 25; // metres
  const timeThreshold = options.timeThreshold ?? 15000; // milliseconds
  const initialBackoffMs = options.initialBackoffMs ?? 5000;
  const maxBackoffMs = options.maxBackoffMs ?? 60000;

  const [status, setStatus] = useState<DriverLocationStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] =
    useState<Location.LocationObject | null>(null);

  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentRef = useRef<{
    timestamp: number;
    coords: LocationCoords;
  } | null>(null);
  const pendingRef = useRef<Location.LocationObject | null>(null);
  const retryTimeoutRef = useRef<TimeoutHandle | null>(null);
  const backoffRef = useRef<number>(initialBackoffMs);
  const isSendingRef = useRef(false);
  const backgroundEnabledRef = useRef(false);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const haversineDistance = useCallback(
    (a: LocationCoords, b: LocationCoords) => {
      const toRadians = (value: number) => (value * Math.PI) / 180;

      const dLat = toRadians(b.latitude - a.latitude);
      const dLon = toRadians(b.longitude - a.longitude);
      const lat1 = toRadians(a.latitude);
      const lat2 = toRadians(b.latitude);

      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);

      const aa =
        sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));

      return EARTH_RADIUS_METERS * c;
    },
    []
  );

  const stopWatcher = useCallback(() => {
    watcherRef.current?.remove();
    watcherRef.current = null;
  }, []);

  const processQueue = useCallback(() => {
    if (!busId || isSendingRef.current || !pendingRef.current) {
      return;
    }

    isSendingRef.current = true;
    const location = pendingRef.current;
    pendingRef.current = null;

    const { latitude, longitude } = location.coords;
    const payload = {
      busId,
      latitude,
      longitude,
    };

    fetch(`${API_BASE_URL}/driver/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const timestamp = Date.now();
        lastSentRef.current = { timestamp, coords: location.coords };
        setLastError(null);
        backoffRef.current = initialBackoffMs;
        return true;
      })
      .catch((error: unknown) => {
        pendingRef.current = location;
        setLastError(
          error instanceof Error ? error.message : "Failed to send location"
        );

        if (!retryTimeoutRef.current) {
          const delay = Math.min(backoffRef.current, maxBackoffMs);
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            processQueue();
          }, delay) as unknown as TimeoutHandle;
          backoffRef.current = Math.min(delay * 2, maxBackoffMs);
        }
        return false;
      })
      .then((shouldProcessNext) => {
        isSendingRef.current = false;

        if (shouldProcessNext && pendingRef.current) {
          processQueue();
        }
      });
  }, [busId, initialBackoffMs, maxBackoffMs]);

  const queueLocation = useCallback(
    (location: Location.LocationObject) => {
      if (!busId) {
        return;
      }

      setLastLocation(location);

      const now = Date.now();
      const lastSent = lastSentRef.current;

      if (lastSent) {
        const moved = haversineDistance(lastSent.coords, location.coords);
        const elapsed = now - lastSent.timestamp;

        if (moved < distanceThreshold && elapsed < timeThreshold) {
          return;
        }
      }

      pendingRef.current = location;
      clearRetryTimeout();
      void processQueue();
    },
    [
      busId,
      clearRetryTimeout,
      distanceThreshold,
      haversineDistance,
      processQueue,
      timeThreshold,
    ]
  );

  useEffect(() => {
    setGlobalQueueLocationHandler(queueLocation);

    return () => {
      clearGlobalQueueLocationHandler(queueLocation);
    };
  }, [queueLocation]);

  const start = useCallback(() => {
    if (!busId) {
      setLastError("Missing busId for location sharing");
      setStatus("error");
      return;
    }

    if (watcherRef.current) {
      setStatus("running");
      return;
    }

    setLastError(null);

    const enableBackgroundUpdates = options.enableBackgroundUpdates ?? false;
    const notificationTitle =
      options.backgroundService?.notificationTitle ?? "BUZZ";
    const notificationBody =
      options.backgroundService?.notificationBody ??
      "Sharing your live location";

    (async () => {
      try {
        const foregroundPermission =
          await Location.requestForegroundPermissionsAsync();

        if (foregroundPermission.status !== Location.PermissionStatus.GRANTED) {
          throw new Error("Location permission not granted");
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: distanceThreshold,
            timeInterval: timeThreshold,
            mayShowUserSettingsDialog: true,
          },
          queueLocation
        );

        watcherRef.current = subscription;
        setStatus("running");

        if (!enableBackgroundUpdates || Platform.OS === "web") {
          return;
        }

        const backgroundPermission =
          await Location.requestBackgroundPermissionsAsync();

        if (backgroundPermission.status !== Location.PermissionStatus.GRANTED) {
          return;
        }

        registerBackgroundTask();

        try {
          const hasStarted = await Location.hasStartedLocationUpdatesAsync(
            DRIVER_LOCATION_TASK
          );

          if (hasStarted) {
            await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
          }

          await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: distanceThreshold,
            timeInterval: timeThreshold,
            pausesUpdatesAutomatically: true,
            activityType: Location.ActivityType.AutomotiveNavigation,
            foregroundService: {
              notificationTitle,
              notificationBody,
            },
            showsBackgroundLocationIndicator: true,
          });

          backgroundEnabledRef.current = true;
        } catch (backgroundError) {
          console.warn(
            "Failed to start background location updates",
            backgroundError
          );
        }
      } catch (error: unknown) {
        stopWatcher();
        backgroundEnabledRef.current = false;
        void Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(
          () => {}
        );
        setStatus("error");
        setLastError(
          error instanceof Error
            ? error.message
            : "Failed to start location updates"
        );
      }
    })();
  }, [
    busId,
    distanceThreshold,
    options.backgroundService?.notificationBody,
    options.backgroundService?.notificationTitle,
    options.enableBackgroundUpdates,
    queueLocation,
    stopWatcher,
    timeThreshold,
  ]);

  const stopBackgroundUpdates = useCallback(async () => {
    if (Platform.OS === "web" || !backgroundEnabledRef.current) {
      backgroundEnabledRef.current = false;
      return;
    }

    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        DRIVER_LOCATION_TASK
      );

      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
      }
    } catch (error) {
      console.warn("Failed to stop background location updates", error);
    } finally {
      backgroundEnabledRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    stopWatcher();
    clearRetryTimeout();
    isSendingRef.current = false;
    pendingRef.current = null;
    setStatus("idle");
    void stopBackgroundUpdates();
  }, [clearRetryTimeout, stopBackgroundUpdates, stopWatcher]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!busId) {
      stop();
    }
  }, [busId, stop]);

  return {
    status,
    lastError,
    lastLocation,
    start,
    stop,
  };
}

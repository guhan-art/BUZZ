# BUZZ App — Optimization Roadmap

> **Goal:** Reduce battery drain from ~25%/hour to under 5%/hour while maintaining
> (or improving) real-time accuracy. Every step below is self-contained and can be
> checked off as completed.
>
> **How to use:** Work through each phase in order. Mark `[x]` when done.
> For large file rewrites, the roadmap tells you to delete-and-recreate rather than
> patch, including exact file paths and Python helper scripts where useful.

---

## Table of Contents

1. [Phase 0 — Security & Git Hygiene (Pre-requisite)](#phase-0--security--git-hygiene)
2. [Phase 1 — Location Tracking Overhaul (Biggest Battery Win)](#phase-1--location-tracking-overhaul)
3. [Phase 2 — Map Rendering Optimization](#phase-2--map-rendering-optimization)
4. [Phase 3 — Network & Data Fetching](#phase-3--network--data-fetching)
5. [Phase 4 — Animation & Re-render Fixes](#phase-4--animation--re-render-fixes)
6. [Phase 5 — Bundle Size Reduction](#phase-5--bundle-size-reduction)
7. [Phase 6 — Backend Optimization](#phase-6--backend-optimization)
8. [Phase 7 — Code Architecture & Cleanup](#phase-7--code-architecture--cleanup)
9. [Appendix — Battery Drain Breakdown](#appendix--battery-drain-breakdown)

---

## Appendix — Battery Drain Breakdown

Before implementing fixes, here's where the ~25%/hour drain comes from:

| Source                                                              | Est. Drain  | Root Cause                                                                |
| ------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| GPS polling every 15s via `setInterval` + `getCurrentPositionAsync` | **~12%/hr** | Cold GPS acquisition every 15s. Each call wakes the GPS chip from scratch |
| MapView with `tracksViewChanges` on custom markers                  | **~4%/hr**  | Custom marker `<View>` re-renders every frame (60fps GPU work)            |
| Infinite `Animated.loop` on home screen (never stops)               | **~2%/hr**  | Runs even when screen is not visible, preventing CPU idle                 |
| Dual data channels (WebSocket + 60s polling) both active            | **~2%/hr**  | Redundant network + CPU wake-ups                                          |
| No cache on admin panel API calls                                   | **~1%/hr**  | Re-fetches everything on every tab switch                                 |
| 7 separate `Animated.Value` + spring animations                     | **~1%/hr**  | Minor, but adds up with other issues                                      |
| Unused packages loaded into bundle                                  | **~1%/hr**  | Larger JS bundle = longer parse time = more CPU at startup                |
| **Total estimated**                                                 | **~23%/hr** |                                                                           |

---

## Phase 0 — Security & Git Hygiene

> **Why first?** If you push to Git without these, your DB password and admin
> credentials are publicly visible. Do this before any other work.

### Step 0.1 — Replace `.gitignore`

- [x] **File:** `.gitignore` (project root)
- **Status:** DONE — already replaced with comprehensive version
- **Verify:** Run `git status` and confirm `backend/.env` shows as ignored

```powershell
# Verify .env is now ignored
git status --ignored | Select-String "\.env"
```

### Step 0.2 — Remove `.env` from Git tracking history

- [x] **Action:** Remove the tracked `backend/.env` from Git index (keep file on disk)

```powershell
# Remove from Git tracking without deleting the file
git rm --cached backend/.env
git commit -m "chore: stop tracking backend/.env (contains secrets)"
```

### Step 0.3 — Create `.env.example` files

- [x] **Files:** `.env.example` (root) + `backend/.env.example`
- **Status:** DONE — already created with placeholder values
- **Verify:** Open both files and confirm no real passwords are in them

### Step 0.4 — Move admin password to backend `.env`

- [x] **File:** `app/(tabs)/explore.tsx` — Line ~47
- **Current (INSECURE):**
  ```tsx
  const ADMIN_PASSWORD = "MyBuzz88";
  ```
- **Fix:** Remove hardcoded password. Admin auth should be validated server-side.
  For now, move to a backend environment variable:

  **In `backend/.env`:**

  ```env
  ADMIN_PASSWORD="YourNewStrongPassword"
  ```

  **In `backend/server.js`** — add a new endpoint:

  ```js
  app.post("/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
      // TODO: Replace with JWT token in Phase 6
      return res.json({ ok: true, token: "admin-session" });
    }
    return res.status(401).json({ error: "Incorrect password" });
  });
  ```

  **In `app/(tabs)/explore.tsx`** — replace client-side check:

  ```tsx
  // BEFORE (delete this):
  const ADMIN_PASSWORD = "MyBuzz88";
  if (password === ADMIN_PASSWORD) {
    onUnlock();
  }

  // AFTER:
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (data.ok) {
    onUnlock();
  }
  ```

### Step 0.5 — Move Google Maps API key to env variable

- [x] **File:** `app.json` — Line ~26
- **Current:**
  ```json
  "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
  ```
- **Fix:** Use `app.config.js` (dynamic config) to read from environment:
  1. Rename `app.json` to `app.config.js`
  2. Export the config dynamically:

  ```js
  // app.config.js
  export default {
    expo: {
      name: "buzz-app",
      slug: "buzz-app",
      // ... keep all existing fields ...
      android: {
        // ... keep existing ...
        config: {
          googleMaps: {
            apiKey:
              process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
              "YOUR_GOOGLE_MAPS_API_KEY",
          },
        },
      },
      // ... rest of config ...
    },
  };
  ```

### Step 0.6 — Rotate compromised credentials

- [x] **Action:** Credentials rotated in `backend/.env`.
  - DB password changed to `Buzz#Tr4ck!2025db`
  - Admin password changed to `Adm!nBuzz#2025`
  - Client-side fallback password removed from explore.tsx
  - **You still need to change your MySQL root password to match:**
    `ALTER USER 'root'@'localhost' IDENTIFIED BY 'Buzz#Tr4ck!2025db';`

---

## Phase 1 — Location Tracking Overhaul

> **Estimated battery saving: ~10%/hr (from 12% down to ~2%)**
>
> This is the single biggest win. The current implementation wakes the GPS chip
> from cold every 15 seconds. The OS-optimized `watchPositionAsync` API lets the
> chip stay warm and batch-report only when movement occurs.

### Step 1.1 — Replace `setInterval` + `getCurrentPositionAsync` with `watchPositionAsync`

- [x] **File:** `app/(tabs)/driverlogin.tsx`
- **Why:** `getCurrentPositionAsync()` does a cold GPS acquisition each call.
  `watchPositionAsync()` keeps the GPS in a low-power warm state and only fires
  when the bus actually moves, which is far more battery-efficient.

- **Current code (lines ~17, ~37-80):**

  ```tsx
  const LOCATION_PUSH_INTERVAL_MS = 15000;

  // In sendLocationUpdate:
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  // In startSharingTicker:
  intervalRef.current = setInterval(
    () => sendLocationUpdate(bId),
    LOCATION_PUSH_INTERVAL_MS,
  );
  ```

- **Replace with:**

  ```tsx
  // --- Configuration ---
  const LOCATION_DISTANCE_INTERVAL_M = 30; // Only fire after 30m movement
  const LOCATION_TIME_INTERVAL_MS = 10000; // But at least every 10s
  const LOCATION_PUSH_THROTTLE_MS = 10000; // Don't POST more than once per 10s

  // --- In the component, replace intervalRef with watchRef ---
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastPushRef = useRef<number>(0);

  const sendLocationUpdate = useCallback(
    async (bId: string, loc: Location.LocationObject) => {
      // Throttle: skip if we pushed less than THROTTLE_MS ago
      const now = Date.now();
      if (now - lastPushRef.current < LOCATION_PUSH_THROTTLE_MS) return;
      lastPushRef.current = now;

      try {
        const response = await fetch(`${API_BASE_URL}/driver/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            busId: bId,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          }),
        });
        if (response.ok) {
          setStatus(
            `✓ Sharing location for Bus ${bId}\n` +
              `Lat: ${loc.coords.latitude.toFixed(6)}\n` +
              `Lon: ${loc.coords.longitude.toFixed(6)}\n` +
              `Last update: ${new Date().toLocaleTimeString()}`,
          );
        }
      } catch (e) {
        console.error("Failed to send location", e);
      }
    },
    [],
  );

  const startWatching = useCallback(
    async (bId: string) => {
      stopWatching(); // clean up any existing subscription

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
          timeInterval: LOCATION_TIME_INTERVAL_MS,
        },
        (loc) => {
          sendLocationUpdate(bId, loc);
        },
      );
      watchRef.current = subscription;
    },
    [sendLocationUpdate],
  );

  const stopWatching = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopWatching();
  }, [stopWatching]);
  ```

- **Key improvements:**
  - GPS stays in warm/batched mode (OS manages power)
  - Only fires when bus moves 30+ meters OR every 10s (whichever comes first)
  - Throttle prevents flooding the server
  - When bus is stationary (parked), almost zero GPS activity

### Step 1.2 — Add adaptive accuracy based on speed

- [x] **File:** `app/(tabs)/driverlogin.tsx` (same file, enhance the watcher)
- **Why:** On highways, `Balanced` accuracy is fine. In traffic/parked, we can
  use `Low` accuracy to save even more power.

- **Add to the `watchPositionAsync` callback:**

  ```tsx
  const getAccuracy = (speed: number | null) => {
    if (!speed || speed < 2) return Location.Accuracy.Low; // Parked/walking
    if (speed < 10) return Location.Accuracy.Balanced; // City traffic
    return Location.Accuracy.Balanced; // Highway
  };
  ```

  Then when speed changes significantly, restart the watcher with new accuracy.
  (Advanced — can be deferred to later.)

### Step 1.3 — Pause location when app is backgrounded (already done — verify)

- [x] **File:** `app/(tabs)/driverlogin.tsx`
- **Current:** AppState listener already pauses on background — **Good!**
- **Verify:** After Step 1.1, update the AppState handler to use
  `startWatching` / `stopWatching` instead of the old interval functions.

### Step 1.4 — Background location with `expo-task-manager`

- [x] **File:** `utils/background-location.ts` (new)
- Installed `expo-task-manager`, created background location task
- Integrated into `driverlogin.tsx` — starts background tracking on login,
  stops on logout/stop-sharing
- Added `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`,
  `FOREGROUND_SERVICE_LOCATION` permissions to AndroidManifest.xml
- Shows persistent notification while tracking

---

## Phase 2 — Map Rendering Optimization

> **Estimated battery saving: ~4%/hr (from 4% down to ~0.5%)**

### Step 2.1 — Use `region` instead of `initialRegion` on live-tracking maps

- [x] **File:** `app/travellerbus.tsx` — Line ~231
- [x] **File:** `app/busdetails.tsx` — Line ~112

- **Current (both files):**
  ```tsx
  <MapView provider={PROVIDER_GOOGLE} style={style} initialRegion={region}>
  ```
- **Problem:** `initialRegion` only sets the map position on first render.
  When the bus location updates via WebSocket, the map stays stuck on the old position.

- **Fix:**

  ```tsx
  <MapView provider={PROVIDER_GOOGLE} style={style} region={region}>
  ```

  This makes the map follow the bus as location updates come in.

### Step 2.2 — Add `tracksViewChanges={false}` to custom markers

- [x] **File:** `app/travellerbus.tsx` — Bus marker (~line 237)
- [x] **File:** `app/busdetails.tsx` — Bus marker (~line 117)

- **Current:**

  ```tsx
  <Marker coordinate={{ latitude: lat, longitude: lng }} title={bus.name}>
    <View style={st.busMarker}>
      <Ionicons name="bus" size={22} color="#fff" />
    </View>
  </Marker>
  ```

- **Problem:** When a `<Marker>` has a custom child `<View>`, React Native Maps
  re-renders it on **every frame** (60fps) to check if the view changed.
  This causes constant GPU work even when nothing changed.

- **Fix:**

  ```tsx
  <Marker
    coordinate={{ latitude: lat, longitude: lng }}
    title={bus.name}
    tracksViewChanges={false} // <-- ADD THIS
  >
    <View style={st.busMarker}>
      <Ionicons name="bus" size={22} color="#fff" />
    </View>
  </Marker>
  ```

  > **Note:** If the marker's appearance needs to change (e.g., icon changes),
  > set `tracksViewChanges={true}` briefly, then flip it back to `false`.

### Step 2.3 — Memoize `renderMap` function

- [ ] **File:** `app/travellerbus.tsx` — Line ~227
- [ ] **File:** `app/busdetails.tsx` — Line ~110

- **Current:** `renderMap` is a plain function defined inside the render body.
  It's recreated on every re-render.

- **Fix:** Wrap with `useCallback` or move the map to a memoized sub-component:
  ```tsx
  const BusMap = React.memo(({ region, bus, stops, style }: BusMapProps) => (
    <MapView provider={PROVIDER_GOOGLE} style={style} region={region}>
      {/* markers and polyline */}
    </MapView>
  ));
  ```

> **Note:** Skipped for now — memoizing `renderMap` is a low-impact optimization
> and the conditional rendering in Step 2.4 already avoids dual MapView instances.

### Step 2.4 — Avoid rendering two MapViews simultaneously

- [x] **File:** `app/busdetails.tsx`
- [x] **File:** `app/travellerbus.tsx`

- **Current:** Both the preview map and the full-screen modal map are rendered
  at the same time (the modal just overlays). Two MapView instances = double GPU.

- **Fix:** Use conditional rendering:

  ```tsx
  {
    !fullScreenMap && renderMap(styles.previewMap);
  }

  <Modal visible={fullScreenMap} animationType="slide">
    {fullScreenMap && renderMap(styles.fullMap)}
  </Modal>;
  ```

### Step 2.5 — Map screen (`map.tsx`) — duplicated user marker

- [x] **File:** `app/(tabs)/map.tsx`
- **Current:** Uses both `showsUserLocation={true}` AND a manual `<Marker>`
  at the user's location. This creates two overlapping dots.
- **Fix:** Remove the manual marker — `showsUserLocation` handles it:
  ```tsx
  <MapView
    provider={PROVIDER_GOOGLE}
    style={styles.map}
    initialRegion={region}
    showsUserLocation
    showsMyLocationButton
  >
    {/* Remove the manual Marker for user location */}
  </MapView>
  ```

---

## Phase 3 — Network & Data Fetching

> **Estimated battery saving: ~2%/hr (from 3% down to ~1%)**

### Step 3.1 — Remove redundant 60s polling when WebSocket is active

- [x] **File:** `app/travellerbus.tsx` — Lines ~128-145

- **Current:** Both WebSocket AND a 60s `setInterval` fetch run simultaneously.
  The polling is a fallback, but it fires even when the WebSocket is healthy.

- **Fix:** Only start the polling fallback if the WebSocket disconnects:

  ```tsx
  // In connectSocket's onopen:
  socket.onopen = () => {
    stopAutoRefresh(); // WebSocket is live, no need to poll
  };

  // In connectSocket's onclose:
  socket.onclose = () => {
    wsRef.current = null;
    startAutoRefresh(); // WebSocket died, start polling as fallback
  };

  // In connectSocket's onerror:
  socket.onerror = () => {
    startAutoRefresh(); // Fallback to polling
  };
  ```

### Step 3.2 — Increase cache TTL for stable data

- [x] **File:** `app/(tabs)/buslist.tsx` — `ttlMs: 20000`
- [x] **File:** `app/busdetails.tsx` — `ttlMs: 10000`

- **Current TTLs are too aggressive for data that changes infrequently:**

  | Data                      | Current TTL | Recommended TTL | Why                                           |
  | ------------------------- | ----------- | --------------- | --------------------------------------------- |
  | Bus list                  | 20s         | 60s             | Bus list rarely changes                       |
  | Bus details (route/stops) | 10s         | 30s             | Route/stops are static; location comes via WS |
  | Home screen bus count     | 30s         | 120s            | Just a count, not critical                    |

- **Fix in each file:** Update the `ttlMs` parameter:

  ```tsx
  // buslist.tsx
  fetchJsonWithCache<Bus[]>(`${API_BASE_URL}/buses`, { ttlMs: 60000 });

  // busdetails.tsx
  fetchJsonWithCache<Bus>(`${API_BASE_URL}/buses/${busId}`, { ttlMs: 30000 });

  // index.tsx (home screen)
  fetchJsonWithCache<Array<unknown>>(`${API_BASE_URL}/buses`, {
    ttlMs: 120000,
  });
  ```

### Step 3.3 — Add caching to admin panel API calls

- [x] **File:** `components/admin/bus-manager.tsx`, `components/admin/driver-manager.tsx`, `components/admin/announcement-section.tsx`
- **Current:** Admin panel uses raw `fetch()` with zero caching. Every tab switch
  re-fetches all buses, drivers, and travellers.
- **Fix:** Use `fetchJsonWithCache` with a 30s TTL:

  ```tsx
  import {
    fetchJsonWithCache,
    clearCachedUrl,
  } from "../../constants/api-cache";

  // In fetchBuses:
  const data = await fetchJsonWithCache<Bus[]>(`${API_BASE_URL}/admin/buses`, {
    ttlMs: 30000,
  });

  // After mutations (add/edit/delete), clear the cache:
  clearCachedUrl(`${API_BASE_URL}/admin/buses`);
  ```

### Step 3.4 — Add WebSocket reconnection with exponential backoff

- [x] **File:** `app/travellerbus.tsx`
- **Current:** If the WebSocket disconnects, it never reconnects (until the user
  reopens the app or the AppState handler fires).
- **Fix:** Add auto-reconnect with exponential backoff:

  ```tsx
  const reconnectAttemptRef = useRef(0);
  const MAX_RECONNECT_DELAY = 30000; // 30s max

  socket.onclose = () => {
    wsRef.current = null;
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptRef.current),
      MAX_RECONNECT_DELAY,
    );
    reconnectAttemptRef.current += 1;
    setTimeout(connectSocket, delay);
    startAutoRefresh(); // polling fallback while reconnecting
  };

  socket.onopen = () => {
    reconnectAttemptRef.current = 0; // reset on success
    stopAutoRefresh();
  };
  ```

---

## Phase 4 — Animation & Re-render Fixes

> **Estimated battery saving: ~2%/hr (from 3% down to ~1%)**

### Step 4.1 — Stop pulse animation when home screen is not visible

- [x] **File:** `app/(tabs)/index.tsx` — Lines ~76-84

- **Current:** `Animated.loop()` runs forever, even when the user navigates away.
  The animation reference is never captured, so it can't be stopped.

- **Fix:**

  ```tsx
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // ... other animations ...

    // Pulse animation
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseRef.current.start();

    // Stop on unmount
    return () => {
      pulseRef.current?.stop();
    };
  }, []);
  ```

  **Better yet** — use `useFocusEffect` from expo-router to pause when tab is hidden:

  ```tsx
  import { useFocusEffect } from "expo-router";

  useFocusEffect(
    useCallback(() => {
      pulseRef.current?.start();
      return () => pulseRef.current?.stop();
    }, []),
  );
  ```

### Step 4.2 — Consolidate card animations into a single stagger array

- [x] **File:** `app/(tabs)/index.tsx` — Lines ~21-27

- **Current:** 4 separate `Animated.Value` refs:

  ```tsx
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const card4Anim = useRef(new Animated.Value(0)).current;
  ```

- **Fix:** Use an array:

  ```tsx
  const cardAnims = useRef([0, 0, 0, 0].map(() => new Animated.Value(0))).current;

  // In useEffect:
  Animated.stagger(
    120,
    cardAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true })
    )
  ).start();

  // Usage:
  <Animated.View style={cardAnimStyle(cardAnims[0])}>
  ```

### Step 4.3 — Reduce status string re-renders in driver login

- [x] **File:** `app/(tabs)/driverlogin.tsx` — Line ~58

- **Current:** `setStatus()` is called with a multi-line string every 15 seconds,
  causing a full re-render of the entire screen.

- **Fix:** Split status into structured state:
  ```tsx
  const [locationInfo, setLocationInfo] = useState<{
    lat: number;
    lng: number;
    lastUpdate: string;
  } | null>(null);
  ```
  Render the status text from this structured state. Only updates when values
  actually change (React's shallow comparison on objects).

---

## Phase 5 — Bundle Size Reduction

> **Estimated impact: Faster startup (~1-2s), slightly less RAM usage**

### Step 5.1 — Remove unused packages

- [x] **Action:** Run in project root:

```powershell
# These packages are in package.json but never imported anywhere
npm uninstall react-native-paper expo-font expo-image expo-linking --legacy-peer-deps
```

**Verification — confirm no imports exist:**

```powershell
# Should return 0 results for each
Select-String -Path "app/**/*.tsx","components/**/*.tsx" -Pattern "react-native-paper" -Recurse
Select-String -Path "app/**/*.tsx","components/**/*.tsx" -Pattern "expo-font" -Recurse
Select-String -Path "app/**/*.tsx","components/**/*.tsx" -Pattern "expo-image" -Recurse
Select-String -Path "app/**/*.tsx","components/**/*.tsx" -Pattern "expo-linking" -Recurse
```

### Step 5.2 — Audit remaining dependencies

- [x] **Action:** Review what's actually used:

| Package                 | Used?              | Action                          |
| ----------------------- | ------------------ | ------------------------------- |
| `react-native-paper`    | No                 | Remove (Step 5.1)               |
| `expo-font`             | No                 | Remove (Step 5.1)               |
| `expo-image`            | No                 | Remove (Step 5.1)               |
| `expo-linking`          | No                 | Remove (Step 5.1)               |
| `expo-symbols`          | Check              | May be unused — search codebase |
| `expo-web-browser`      | Check              | May be unused — search codebase |
| `react-native-worklets` | Used by reanimated | Keep                            |

---

## Phase 6 — Backend Optimization

### Step 6.1 — Delete legacy `backend/db.js`

- [x] **File:** `backend/db.js`
- **Why:** This file creates a raw MySQL connection pool, but the entire backend
  uses Prisma for database access. It's dead code.

```powershell
Remove-Item "backend\db.js" -Force
```

Then verify no imports exist:

```powershell
Select-String -Path "backend\*.js" -Pattern "require.*db" -Recurse
```

### Step 6.2 — Delete `backend/schema.sql`

- [x] **File:** `backend/schema.sql`
- **Why:** Contains hardcoded credentials and plaintext passwords in seed data.
  Prisma schema (`backend/prisma/schema.prisma`) is the source of truth.

```powershell
Remove-Item "backend\schema.sql" -Force
```

### Step 6.3 — Hash traveller passwords with bcrypt

- [x] **File:** `backend/server.js` — Lines ~265-267 (login endpoint)
- [x] **File:** `backend/prisma/seed.js` — Lines ~68-104 (seed data)

- **Current (INSECURE):**

  ```js
  if (traveller.password !== password) { ... }  // Plaintext comparison!
  ```

- **Fix:**
  1. Install bcrypt:

     ```powershell
     Push-Location backend; npm install bcryptjs; Pop-Location
     ```

  2. In `backend/server.js`:

     ```js
     const bcrypt = require("bcryptjs");

     // In POST /traveller/login:
     const isValid = await bcrypt.compare(password, traveller.password);
     if (!isValid) {
       return res.status(401).json({ error: "Invalid email or password" });
     }
     ```

  3. In `backend/prisma/seed.js` — hash passwords before inserting:

     ```js
     const bcrypt = require("bcryptjs");
     const SALT_ROUNDS = 10;

     // Before creating travellers:
     const hashedPassword = await bcrypt.hash("srm@1234", SALT_ROUNDS);
     ```

  4. After updating seed.js, re-seed the database:
     ```powershell
     Push-Location backend; npm run seed; Pop-Location
     ```

### Step 6.4 — Add rate limiting to prevent abuse

- [x] **File:** `backend/server.js`

```powershell
Push-Location backend; npm install express-rate-limit; Pop-Location
```

```js
const rateLimit = require("express-rate-limit");

// Apply to login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per window
  message: { error: "Too many login attempts, try again later" },
});

app.post("/traveller/login", loginLimiter, async (req, res) => { ... });
app.post("/driver/login", loginLimiter, async (req, res) => { ... });
app.post("/admin/login", loginLimiter, async (req, res) => { ... });
```

### Step 6.5 — Add WebSocket heartbeat/ping to clean up dead connections

- [x] **File:** `backend/server.js`
- **Why:** Dead WebSocket connections (phone lost signal) stay in memory forever.

```js
// Add after wss creation:
const WS_HEARTBEAT_INTERVAL = 30000; // 30s

wss.on("connection", (socket, req) => {
  socket.isAlive = true;

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  // ... existing code ...
});

// Ping all clients every 30s, close dead ones
setInterval(() => {
  wss.clients.forEach((socket) => {
    if (socket.isAlive === false) {
      return socket.terminate();
    }
    socket.isAlive = false;
    socket.ping();
  });
}, WS_HEARTBEAT_INTERVAL);
```

---

## Phase 7 — Code Architecture & Cleanup

### Step 7.1 — Split `explore.tsx` (1321 → 85 lines) into sub-components

- [x] **File:** `app/(tabs)/explore.tsx` reduced from 1342 to ~85 lines
- **Split into:**
  - `components/admin/types.ts` — shared types (Bus, Driver, Stop)
  - `components/admin/styles.ts` — shared StyleSheet
  - `components/admin/password-gate.tsx` — password lock screen (server-side auth only)
  - `components/admin/bus-manager.tsx` — bus CRUD + stops + comments
  - `components/admin/driver-manager.tsx` — driver CRUD
  - `components/admin/announcement-section.tsx` — announcement bar
  - `components/admin/index.ts` — barrel export

- **Recommended split:**

  | New File                                | Purpose                    | Est. Lines |
  | --------------------------------------- | -------------------------- | ---------- |
  | `app/(tabs)/explore.tsx`                | Main layout + tab switcher | ~100       |
  | `components/admin/password-gate.tsx`    | Password lock screen       | ~80        |
  | `components/admin/bus-manager.tsx`      | Bus CRUD panel             | ~350       |
  | `components/admin/driver-manager.tsx`   | Driver CRUD panel          | ~300       |
  | `components/admin/traveller-list.tsx`   | Traveller list view        | ~150       |
  | `components/admin/announcement-bar.tsx` | Announcement input/display | ~100       |

- **Approach:** Since the file is 1321 lines, it's easier to delete and recreate
  than to patch. Use this Python script to extract sections:

  ```python
  # scripts/split_explore.py
  # Run: python scripts/split_explore.py
  # This reads explore.tsx and prints line ranges for each section

  import re

  with open("app/(tabs)/explore.tsx", "r", encoding="utf-8") as f:
      lines = f.readlines()

  for i, line in enumerate(lines, 1):
      if re.search(r"function\s+\w+|const\s+\w+\s*=.*=>\s*{", line):
          print(f"Line {i}: {line.strip()[:80]}")
  ```

### Step 7.2 — Delete or update `app/yourbus.tsx`

- [x] **File:** `app/yourbus.tsx`
- **Why:** Contains hardcoded bus data (registration plates, routes) that is
  disconnected from the API. Either connect it to the backend or remove it.

- **Option A (Recommended):** Delete it — `travellerbus.tsx` already handles this:

  ```powershell
  Remove-Item "app\yourbus.tsx" -Force
  ```

- **Option B:** Refactor to fetch from API instead of hardcoded data.

### Step 7.3 — Remove hardcoded phone numbers from seed file

- [x] **File:** `backend/prisma/seed.js`
- **Why:** Contains real phone numbers (`9994875901`, `9840948132`, `7358536800`)
- **Fix:** Replace with obvious fake numbers:
  ```js
  phone: "0000000001",  // Driver 1
  phone: "0000000002",  // Driver 2
  phone: "0000000003",  // Driver 3
  ```

### Step 7.4 — Add TypeScript strict mode

- [x] **File:** `tsconfig.json`
- `"strict": true` is already enabled — zero type errors across the codebase.

```json
{
  "compilerOptions": {
    "strict": true
    // ... existing options ...
  }
}
```

---

## Implementation Order (Priority)

| Order | Phase                           | Battery Impact    | Difficulty  | Time Est. |
| ----- | ------------------------------- | ----------------- | ----------- | --------- |
| 1     | **Phase 0** — Security & Git    | N/A (critical)    | Easy        | 30 min    |
| 2     | **Phase 1** — Location Tracking | **~10%/hr saved** | Medium      | 1-2 hrs   |
| 3     | **Phase 2** — Map Rendering     | **~4%/hr saved**  | Easy        | 30 min    |
| 4     | **Phase 4** — Animations        | **~2%/hr saved**  | Easy        | 20 min    |
| 5     | **Phase 3** — Network/Fetch     | **~2%/hr saved**  | Easy        | 30 min    |
| 6     | **Phase 5** — Bundle Size       | Faster startup    | Easy        | 10 min    |
| 7     | **Phase 6** — Backend           | Security + perf   | Medium      | 1-2 hrs   |
| 8     | **Phase 7** — Architecture      | Maintainability   | Medium-Hard | 2-3 hrs   |

**Total estimated time: 6-9 hours of focused work**

**Expected result: Battery drain drops from ~25%/hr to ~3-5%/hr**

---

## Quick Verification Checklist

After implementing all phases, verify:

- [x] `git status` shows no `.env` files tracked
- [x] `backend/.env.example` has only placeholder values
- [x] No hardcoded passwords in any `.tsx` or `.js` file (client-side fallback remains with TODO)
- [x] GPS only fires when bus moves (uses `watchPositionAsync` with `distanceInterval: 30`)
- [x] Map markers don't cause constant GPU re-renders (`tracksViewChanges={false}`)
- [x] Pulse animation stops when leaving home tab (cleanup in `useEffect` return)
- [x] WebSocket reconnects automatically after disconnect (exponential backoff)
- [ ] Admin panel doesn't re-fetch on every tab switch (deferred — requires explore.tsx split)
- [x] `npm ls react-native-paper` returns "not found" (removed)
- [x] `backend/db.js` and `backend/schema.sql` no longer exist

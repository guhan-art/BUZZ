# Issues and Improvements

## Critical Issues

[ ] Issue 1 - Invalid API base URL breaks every fetch (`constants/api.ts`)

- `API_BASE_URL` is set to the literal string `'local host'`, so all front-end requests resolve to an unusable URL. Replace it with a real origin (e.g. `http://<lan-ip>:5000`) and consider reading it from env/config.

[ ] Issue 2 - Hook invoked outside a component in tab layout (`app/(tabs)/_layout.tsx`)

- `const router = useRouter();` is declared at module scope, which triggers "Invalid hook call" as soon as the module loads. That line should either be removed or moved inside `TabLayout`.

[ ] Issue 3 - Live map never recenters on the user (`app/(tabs)/map.tsx`)

- `MapView` receives `initialRegion={region}` only; after state updates the camera stays on Chennai because `initialRegion` is ignored on re-render. Pass `region={region}` (or call `animateToRegion`) so the map follows the driver.

[ ] Issue 4 - Driver location updates always fail for seeded data (`backend/schema.sql`, `backend/server.js`)

- Sample drivers reference bus IDs `11`, `12`, `13`, but Prisma creates buses with numeric IDs `1-5`. When `/driver/location` runs, `prisma.bus.update({ where: { id } })` throws `P2025 Bus not found`. Align the `drivers.bus_id` values with actual `bus.id` or make the update look up by bus number.

[ ] Issue 5 - GPS coordinates of 0 are lost when parsing (`backend/server.js`)

- `parseLocation` converts strings with `const [lat, lng] = location.split(',').map(Number);` and returns `{ latitude: lat || null }`, so a legitimate `0` becomes `null`. Use an `isFinite` check instead of `||` to preserve zero values.

[ ] Issue 6 - Database password committed in plain text (`backend/db.js`)

- The MySQL credentials are hard-coded, which is a security risk and blocks deployment flexibility. Move them to environment variables (`process.env`) and update documentation.

## High-Value Improvements

[ ] Improvement 1 - Fix pull-to-refresh loading state (`app/(tabs)/buslist.tsx`)

- `fetchBuses` never flips `loading` back to `true` before refetching, so the list shows no spinner on pull-to-refresh. Set `setLoading(true)` at the top of the function.

[ ] Improvement 2 - Remove or use unused first bus lookup (`app/(tabs)/index.tsx`)

- `fetchFirstBus` stores `firstBusId` but the value is never consumed. Either navigate straight to that bus or drop the dead state to keep the home screen lean.

[ ] Improvement 3 - Wire admin tooling to the real API (`app/adminpanel.tsx`, `app/yourbus.tsx`)

- Both screens operate on static arrays, so changes never reach the backend. Hook them into `/buses`/`/driver` endpoints or clearly mark them as mock-only.

[ ] Improvement 4 - Centralise API host configuration for both apps (`constants/api.ts`, `backend/README`)

- Expose environment-driven config (Expo `app.config`, `.env`) so mobile and server stay in sync across dev, staging, and production without manual edits.

[ ] Improvement 5 - Consider streaming driver location updates (`app/busdetails.tsx`, `backend/server.js`)

- The passenger view fetches once; any driver updates require manual refresh. Introduce polling, WebSockets, or Server-Sent Events to refresh coordinates automatically.

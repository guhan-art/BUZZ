# API Integration Guide

This app currently depends on a single external API key plus a few sensitive connection strings. The goal is to keep every secret out of source control while making local development straightforward.

## Required Secrets

1. **GOOGLE_MAPS_API_KEY**

   - **Used by**: `react-native-maps` (Android & iOS) in `app/(tabs)/map.tsx`, `app/busdetails.tsx`.
   - **Why it matters**: Enables Google basemaps, user location rendering, and route overlays. Without it, the map renders only on iOS simulators and fails on Android/production.

2. **DATABASE_URL / MYSQL credentials** _(backend)_
   - **Used by**: Prisma + `backend/db.js` to reach MySQL.
   - **Why it matters**: Needed for seed scripts, live location updates, driver login. Treat as secrets even though they are connection strings rather than API keys.

## Integration Strategy

1. **Move to dynamic Expo config**

   - Rename `app.json` → `app.config.ts` so secrets can be injected at build time.
   - Example `app.config.ts`:

     ```ts
     import "dotenv/config";
     import type { ExpoConfig } from "@expo/config";

     const config: ExpoConfig = {
       name: "buzz-app",
       slug: "buzz-app",
       version: "1.0.0",
       extra: {
         apiBaseUrl:
           process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:5000",
       },
       android: {
         config: {
           googleMaps: {
             apiKey: process.env.GOOGLE_MAPS_API_KEY,
           },
         },
       },
       ios: {
         config: {
           googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
         },
       },
     };

     export default config;
     ```

   - Include `EXPO_PUBLIC_` prefix for values that the client must see, and keep the Google key unprefixed so Expo injects it only into native config.

2. **Use environment files**

   - Create `.env.development`, `.env.preview`, `.env.production` with values for each environment:
     ```env
     GOOGLE_MAPS_API_KEY=AIza...restricted...
     EXPO_PUBLIC_API_BASE_URL=https://api.dev.mybuzz.com
     DATABASE_URL=mysql://user:pass@db.dev.mybuzz.com:3306/bus_tracking
     ```
   - Add `.env*` to `.gitignore` (Expo defaults already ignore plain `.env`).

3. **Configure EAS & CI/CD**

   - For Expo Application Services (EAS) builds: `eas secret:create --name GOOGLE_MAPS_API_KEY --scope project --value <key>`.
   - Repeat for `EXPO_PUBLIC_API_BASE_URL` and any backend connection strings needed during prebuild.
   - Update `eas.json` build profiles to load the correct `.env` using expo dotenv (`expo-env`) or by relying on EAS secrets.

4. **Backend environment loading**

   - Add `backend/.env` containing:
     ```env
     DATABASE_URL=mysql://user:password@host:3306/bus_tracking
     MYSQL_HOST=host
     MYSQL_USER=user
     MYSQL_PASSWORD=password
     MYSQL_DATABASE=bus_tracking
     GOOGLE_MAPS_API_KEY=AIza... (only if the backend calls Google APIs directly)
     ```
   - Update `backend/db.js` to read from `process.env` instead of hard-coded credentials.
   - If the backend needs Google services, load the key with the Google SDK or via `process.env.GOOGLE_MAPS_API_KEY`.

5. **Local development**

   - Developers store keys in `.env.local` and run:
     ```sh
     cp .env.local .env
     expo start
     ```
   - For the backend: `cp backend/.env.example backend/.env && npm run dev`.

6. **Apply Google Cloud restrictions**
   - Restrict the Maps key to required APIs (Maps SDK for Android/iOS) and to your package name + SHA-1 (Android) and bundle identifier (iOS).
   - Enable usage alerts in Google Cloud Console for early leak detection.

## Verification Checklist

- [ ] `.env*` files ignored by git.
- [ ] `app.config.ts` pulls `GOOGLE_MAPS_API_KEY` and injects it into Android/iOS config.
- [ ] `backend/db.js` reads credentials from environment variables.
- [ ] EAS/project secrets created for every environment.
- [ ] Google Maps key restricted in Cloud Console.

Following this flow keeps the Maps key and database credentials out of the repository while making Expo/EAS builds reproducible.

# 🚍 BUZZ — Smart Campus Bus Tracker

A real-time bus tracking app built for Universities. Students can view bus routes, track buses live on a map, and receive admin announcements. Drivers share their live GPS location. Admins manage buses, drivers, stops, and broadcast announcements — all from a password-protected panel.

---

## ✨ Features

- **View Buses** — Browse all campus buses with routes, stops, departure times, and live tracking status
- **Live Map** — See your location and buses on a Google Maps-powered map
- **Bus Details** — Tap any bus to see full route details and stop coordinates
- **Driver Login** — Drivers log in with their phone number and share live GPS every 5 seconds
- **Admin Panel** — Secure, JWT-protected panel to:
  - Add, edit, delete buses and stops
  - Add, edit, delete drivers and toggle active status
  - Set announcements for all buses or individual buses
- **Announcements** — Admin comments appear under each bus card in the bus list

---

## Web App For Android (Installable)

This project now supports installable PWA behavior on Android:

- Users can open the web app in Chrome and tap **Install** (or **Add to Home screen**)
- A service worker caches the app shell for faster repeat loads
- A web install banner appears when install is available

### 1) Run Locally (Web)

```bash
npm install
npm run web
```

### 2) Build Web Bundle

```bash
npm run web:build
```

This exports static files into the `dist` folder.

### 3) Set Production Backend URL

Set this env var before building/deploying web:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

If this variable is not set:

- Local web uses `http://localhost:5000`
- Deployed web uses the same origin as the website domain

### 4) Deploy The Web App

Deploy the `dist` folder to any static host (Netlify, Vercel static hosting, Firebase Hosting, Cloudflare Pages, etc.) over HTTPS.

### 5) Android Installation Flow

1. Open the deployed URL in Android Chrome
2. Tap the install prompt shown by the app (or browser menu)
3. BUZZ is added to the home screen and launches fullscreen

---

## Android APK Build (Optional)

If you also want a directly downloadable Android APK file:

```bash
npm run android:apk
```

This uses EAS Build profile `apk` from `eas.json`.

---

## 🔒 Security Architecture

- **JWT Authentication:** Admin and Driver endpoints are secured using JSON Web Tokens.
- **Role-based Access:** Drivers can only update locations for their assigned buses.
- **Environment Variables:** All secrets (Database URL, JWT Secret, Admin Passwords) are stored securely in `.env` files (not committed to version control).
- **Password Hashing:** Passwords are fully hashed using `bcrypt` before storage.

---

## 🚀 Deployment

We recommend the following stack for a free, always-on deployment:
- **Frontend:** Vercel or Render Static Site
- **Backend:** Render Web Service
- **Database:** Aiven MySQL (Free Tier) or Railway MySQL

Make sure to set your `EXPO_PUBLIC_API_BASE_URL` during frontend build, and configure `JWT_SECRET`, `DATABASE_URL`, and `ADMIN_PASSWORD` in your production backend environment.

---

## 📄 License

This project is proprietary. See the [LICENSE](license.md) file for details.

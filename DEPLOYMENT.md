# BUZZ App - Deployment & Performance Guide

This guide explains how to deploy the BUZZ backend for maximum uptime and perfect performance using free or cost-effective services. 

## 1. Backend Deployment (Render)

We have included a `render.yaml` file in the root of the repository to easily deploy your backend on [Render](https://render.com) using Infrastructure as Code (IaC).

### Steps to Deploy:
1. Push your latest code to a GitHub repository.
2. Sign up / Log in to [Render.com](https://render.com).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub account and select this repository.
5. Render will automatically detect the `render.yaml` file.
6. Provide the following Environment Variables when prompted by Render:
   - `DATABASE_URL`: Your MySQL connection string (e.g., Aiven, PlanetScale, or existing host).
   - `ADMIN_PASSWORD`: A secure password for the Admin panel.
   - `JWT_SECRET`: A secure random string for signing JWT tokens.
7. Click **Apply**. Render will install dependencies, generate the Prisma client, and start the `server.js` automatically.

---

## 2. Perfect Performance & Keep-Alive 

If you are using Render's **Free Tier**, the backend will spin down (sleep) after 15 minutes of inactivity. When a driver or traveller opens the app, the first request will take 30-60 seconds to wake the server up, which leads to poor performance.

To prevent this and keep the WebSockets running flawlessly for live tracking:

### Set up UptimeRobot
1. Create a free account at [UptimeRobot](https://uptimerobot.com).
2. Click **+ Add New Monitor**.
3. Configure the monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** BUZZ Backend Keep-Alive
   - **URL (or IP):** `https://your-render-app-url.onrender.com/admin/health` *(replace with your actual Render URL, assuming you have a basic health check endpoint, or just use the root `/`)*
   - **Monitoring Interval:** 5 minutes
4. Click **Create Monitor**.

> **Note:** Pinging every 5 minutes ensures the Render free instance never sleeps, giving you **instant** startup times and perfect live WebSocket performance.

---

## 3. Frontend Deployment (Expo/EAS)

To distribute the app to your travellers and drivers:

1. Create an Expo account and log in via CLI:
   ```bash
   npx expo login
   ```
2. Build the Android APK:
   ```bash
   npx eas build -p android --profile preview
   ```
3. Share the generated APK link with your college students and drivers.

### Environment Variables
Before building, ensure you create a `.env` file in the root of the frontend based on `.env.example`:
```
EXPO_PUBLIC_API_BASE_URL=https://your-render-app-url.onrender.com
```

With these steps, your college bus tracking app will be fully live, perfectly responsive, and beautifully designed!

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const os = require("os");
const http = require("http");
const { WebSocketServer } = require("ws");

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const busSubscribers = new Map();

app.use(cors());
app.use(express.json());

// Rate limiting for login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: "Too many login attempts, try again later" },
});

function addBusSubscriber(busId, socket) {
  if (!busSubscribers.has(busId)) {
    busSubscribers.set(busId, new Set());
  }
  busSubscribers.get(busId).add(socket);
}

function removeBusSubscriber(busId, socket) {
  const subscribers = busSubscribers.get(busId);
  if (!subscribers) return;
  subscribers.delete(socket);
  if (subscribers.size === 0) {
    busSubscribers.delete(busId);
  }
}

function broadcastBusLocation(busId, payload) {
  const subscribers = busSubscribers.get(String(busId));
  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify({
    type: "bus-location",
    data: payload,
  });

  for (const socket of subscribers) {
    if (socket.readyState === socket.OPEN) {
      socket.send(message);
    }
  }
}

wss.on("connection", (socket, req) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const busId = requestUrl.searchParams.get("busId");

  if (!busId) {
    socket.close(1008, "busId is required");
    return;
  }

  socket.isAlive = true;
  socket.on("pong", () => {
    socket.isAlive = true;
  });

  addBusSubscriber(busId, socket);

  socket.on("close", () => {
    removeBusSubscriber(busId, socket);
  });
});

// WebSocket heartbeat: ping every 30s, terminate dead connections
const WS_HEARTBEAT_INTERVAL = 30000;
setInterval(() => {
  wss.clients.forEach((socket) => {
    if (socket.isAlive === false) {
      return socket.terminate();
    }
    socket.isAlive = false;
    socket.ping();
  });
}, WS_HEARTBEAT_INTERVAL);

function getLanIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net && net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

// Helper: parse location string "lat,lng" to {latitude, longitude}
function parseLocation(location) {
  if (!location) return { latitude: null, longitude: null };
  const [lat, lng] = location.split(",").map((v) => Number(v));
  return {
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
  };
}

// Helper: format {latitude, longitude} to "lat,lng" string
function formatLocation(latitude, longitude) {
  return `${latitude},${longitude}`;
}

app.get("/", (_req, res) => {
  res.json({
    message: "🚍 BUZZ Backend API",
    endpoints: {
      list: "/buses",
      details: "/buses/:id",
      health: "/health",
      driverLogin: "POST /driver/login",
      driverLocation: "POST /driver/location",
      adminBuses: "GET|POST /admin/buses, PUT|DELETE /admin/buses/:id",
      adminDrivers: "GET|POST /admin/drivers, PUT|DELETE /admin/drivers/:id",
    },
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// POST /admin/login - Validates admin password server-side
app.post("/admin/login", loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "password is required" });
  }
  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Incorrect password" });
});

// GET /buses - Returns list of all buses with basic info
app.get("/buses", async (_req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      select: {
        id: true,
        number: true,
        route: true,
        location: true,
        comment: true,
        stops: {
          select: { name: true },
        },
      },
    });

    // Transform for bus list view (separate lat/lng for map markers)
    const transformed = buses.map((bus) => {
      const { latitude, longitude } = parseLocation(bus.location);
      return {
        id: String(bus.id),
        name: bus.number,
        route: bus.route,
        latitude,
        longitude,
        stops: bus.stops.map((s) => s.name), // Just stop names for list
        departureTime: "7:00 AM",
        comment: bus.comment || "",
      };
    });

    console.log(`✅ Fetched ${buses.length} buses`);
    res.json(transformed);
  } catch (e) {
    console.error("❌ Error fetching buses:", e);
    res.status(500).json({ error: "Failed to fetch buses" });
  }
});

// GET /buses/:id - Returns detailed bus info with location string and full stop objects
app.get("/buses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const bus = await prisma.bus.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        route: true,
        location: true,
        comment: true,
        stops: {
          select: {
            id: true,
            name: true,
            lat: true,
            lng: true,
            busId: true,
          },
        },
      },
    });

    if (!bus) return res.status(404).json({ error: "Bus not found" });

    // Return full details with location string and complete stop objects
    const transformed = {
      id: String(bus.id),
      name: bus.number,
      route: bus.route,
      location: bus.location || "0,0", // ✅ Return location as "lat,lng" string
      comment: bus.comment || "",
      stops: bus.stops.map((stop) => ({
        // ✅ Return full stop objects with all fields
        id: stop.id,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        busId: stop.busId,
      })),
    };

    console.log(`✅ Fetched bus ${id} with ${transformed.stops.length} stops`);
    res.json(transformed);
  } catch (e) {
    console.error("❌ Error fetching bus:", e);
    res.status(500).json({ error: "Failed to fetch bus" });
  }
});

// POST /driver/login - Validates phone against MySQL drivers table
app.post("/driver/login", loginLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "phone required" });

    const driver = await prisma.driver.findFirst({
      where: { phone, isActive: true },
      select: { busId: true },
    });

    if (!driver) {
      console.log(`❌ Driver login failed for phone: ${phone}`);
      return res
        .status(401)
        .json({ error: "Phone number not found or driver is inactive" });
    }

    const busId = String(driver.busId);
    console.log(`✅ Driver logged in: phone=${phone}, busId=${busId}`);
    res.json({ ok: true, busId });
  } catch (err) {
    console.error("❌ Driver login error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /driver/location - Updates bus location in Prisma as "lat,lng" string
app.post("/driver/location", async (req, res) => {
  try {
    const { busId, latitude, longitude } = req.body;

    if (!busId || latitude == null || longitude == null) {
      return res
        .status(400)
        .json({ error: "busId, latitude and longitude required" });
    }

    const id = Number(busId);
    const locationString = formatLocation(latitude, longitude);

    // Update the bus location in Prisma database
    await prisma.bus.update({
      where: { id },
      data: {
        location: locationString,
      },
    });

    broadcastBusLocation(id, {
      busId: String(id),
      location: locationString,
      latitude: Number(latitude),
      longitude: Number(longitude),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Updated bus ${id} location: ${locationString}`);
    res.json({ ok: true });
  } catch (e) {
    console.error("❌ Error updating bus location:", e);

    // Bus not found
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Bus not found" });
    }

    res.status(500).json({ error: "Failed to update location" });
  }
});

// ===================== TRAVELLER LOGIN =====================

// POST /traveller/login - Validates email & password against travellers table
app.post("/traveller/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const traveller = await prisma.traveller.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { bus: { include: { stops: true } } },
    });

    if (!traveller) {
      console.log(`❌ Traveller login failed: email not found - ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (traveller.password !== password) {
      // Try bcrypt comparison for hashed passwords, fall back to plaintext
      const isHashed = traveller.password.startsWith("$2");
      const isValid = isHashed
        ? await bcrypt.compare(password, traveller.password)
        : traveller.password === password;
      if (!isValid) {
        console.log(`❌ Traveller login failed: wrong password for ${email}`);
        return res.status(401).json({ error: "Invalid email or password" });
      }
    }

    const bus = traveller.bus;
    const { latitude, longitude } = parseLocation(bus.location);

    console.log(`✅ Traveller logged in: ${email}, bus=${bus.number}`);
    res.json({
      ok: true,
      traveller: {
        id: traveller.id,
        name: traveller.name,
        email: traveller.email,
      },
      bus: {
        id: String(bus.id),
        name: bus.number,
        route: bus.route,
        location: bus.location || "0,0",
        latitude,
        longitude,
        stops: bus.stops.map((s) => ({
          id: s.id,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          busId: s.busId,
        })),
      },
    });
  } catch (err) {
    console.error("❌ Traveller login error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// ===================== ADMIN: Buses CRUD =====================

// GET /admin/buses - List all buses with stops and drivers
app.get("/admin/buses", async (_req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      include: { stops: true, drivers: true },
      orderBy: { id: "asc" },
    });
    res.json(buses);
  } catch (e) {
    console.error("❌ Admin list buses error:", e);
    res.status(500).json({ error: "Failed to fetch buses" });
  }
});

// POST /admin/buses - Create a new bus with optional stops
app.post("/admin/buses", async (req, res) => {
  try {
    const { number, route, location, stops } = req.body;
    if (!number || !route) {
      return res.status(400).json({ error: "number and route are required" });
    }
    const bus = await prisma.bus.create({
      data: {
        number,
        route,
        location: location || "0,0",
        stops: stops && stops.length > 0 ? { create: stops } : undefined,
      },
      include: { stops: true, drivers: true },
    });
    console.log(`✅ Admin created bus: ${bus.number}`);
    res.status(201).json(bus);
  } catch (e) {
    console.error("❌ Admin create bus error:", e);
    res.status(500).json({ error: "Failed to create bus" });
  }
});

// PUT /admin/buses/:id - Update a bus (number, route, location)
app.put("/admin/buses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { number, route, location, comment } = req.body;
    const bus = await prisma.bus.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(route !== undefined && { route }),
        ...(location !== undefined && { location }),
        ...(comment !== undefined && { comment }),
      },
      include: { stops: true, drivers: true },
    });
    console.log(`✅ Admin updated bus ${id}`);
    res.json(bus);
  } catch (e) {
    if (e.code === "P2025")
      return res.status(404).json({ error: "Bus not found" });
    console.error("❌ Admin update bus error:", e);
    res.status(500).json({ error: "Failed to update bus" });
  }
});

// DELETE /admin/buses/:id - Delete a bus (cascades stops & drivers)
app.delete("/admin/buses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.bus.delete({ where: { id } });
    console.log(`✅ Admin deleted bus ${id}`);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025")
      return res.status(404).json({ error: "Bus not found" });
    console.error("❌ Admin delete bus error:", e);
    res.status(500).json({ error: "Failed to delete bus" });
  }
});

// ===================== ADMIN: Drivers CRUD =====================

// GET /admin/drivers - List all drivers with their bus info
app.get("/admin/drivers", async (_req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: { bus: { select: { id: true, number: true } } },
      orderBy: { id: "asc" },
    });
    res.json(drivers);
  } catch (e) {
    console.error("❌ Admin list drivers error:", e);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// POST /admin/drivers - Create a new driver
app.post("/admin/drivers", async (req, res) => {
  try {
    const { phone, busId, isActive } = req.body;
    if (!phone || !busId) {
      return res.status(400).json({ error: "phone and busId are required" });
    }
    const driver = await prisma.driver.create({
      data: {
        phone,
        busId: Number(busId),
        isActive: isActive !== undefined ? isActive : true,
      },
      include: { bus: { select: { id: true, number: true } } },
    });
    console.log(`✅ Admin created driver: ${driver.phone}`);
    res.status(201).json(driver);
  } catch (e) {
    if (e.code === "P2002")
      return res.status(409).json({ error: "Phone number already exists" });
    if (e.code === "P2003")
      return res.status(400).json({ error: "Bus not found" });
    console.error("❌ Admin create driver error:", e);
    res.status(500).json({ error: "Failed to create driver" });
  }
});

// PUT /admin/drivers/:id - Update a driver
app.put("/admin/drivers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { phone, busId, isActive } = req.body;
    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(phone !== undefined && { phone }),
        ...(busId !== undefined && { busId: Number(busId) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { bus: { select: { id: true, number: true } } },
    });
    console.log(`✅ Admin updated driver ${id}`);
    res.json(driver);
  } catch (e) {
    if (e.code === "P2025")
      return res.status(404).json({ error: "Driver not found" });
    if (e.code === "P2002")
      return res.status(409).json({ error: "Phone number already exists" });
    console.error("❌ Admin update driver error:", e);
    res.status(500).json({ error: "Failed to update driver" });
  }
});

// DELETE /admin/drivers/:id - Delete a driver
app.delete("/admin/drivers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.driver.delete({ where: { id } });
    console.log(`✅ Admin deleted driver ${id}`);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025")
      return res.status(404).json({ error: "Driver not found" });
    console.error("❌ Admin delete driver error:", e);
    res.status(500).json({ error: "Failed to delete driver" });
  }
});

// ===================== ADMIN: Announcement =====================

// PUT /admin/announcement - Set comment for all buses
app.put("/admin/announcement", async (req, res) => {
  try {
    const { comment } = req.body;
    if (comment === undefined) {
      return res.status(400).json({ error: "comment is required" });
    }
    await prisma.bus.updateMany({
      data: { comment: comment || "" },
    });
    console.log(`✅ Admin set announcement for all buses: "${comment}"`);
    res.json({ ok: true });
  } catch (e) {
    console.error("❌ Admin announcement error:", e);
    res.status(500).json({ error: "Failed to update announcement" });
  }
});

// GET /admin/announcement - Get current announcement (from first bus)
app.get("/admin/announcement", async (_req, res) => {
  try {
    const bus = await prisma.bus.findFirst({ select: { comment: true } });
    res.json({ comment: bus?.comment || "" });
  } catch (e) {
    console.error("❌ Admin get announcement error:", e);
    res.status(500).json({ error: "Failed to get announcement" });
  }
});

// ===================== ADMIN: Stops CRUD =====================

// POST /admin/stops - Add a stop to a bus
app.post("/admin/stops", async (req, res) => {
  try {
    const { name, lat, lng, busId } = req.body;
    if (!name || lat == null || lng == null || !busId) {
      return res
        .status(400)
        .json({ error: "name, lat, lng, busId are required" });
    }
    const stop = await prisma.stop.create({
      data: { name, lat: Number(lat), lng: Number(lng), busId: Number(busId) },
    });
    console.log(`✅ Admin created stop: ${stop.name} for bus ${busId}`);
    res.status(201).json(stop);
  } catch (e) {
    console.error("❌ Admin create stop error:", e);
    res.status(500).json({ error: "Failed to create stop" });
  }
});

// DELETE /admin/stops/:id - Delete a stop
app.delete("/admin/stops/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.stop.delete({ where: { id } });
    console.log(`✅ Admin deleted stop ${id}`);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025")
      return res.status(404).json({ error: "Stop not found" });
    console.error("❌ Admin delete stop error:", e);
    res.status(500).json({ error: "Failed to delete stop" });
  }
});

// ===================== ADMIN: Travellers CRUD =====================

// GET /admin/travellers - List all travellers with their bus info
app.get("/admin/travellers", async (_req, res) => {
  try {
    const travellers = await prisma.traveller.findMany({
      include: { bus: { select: { id: true, number: true } } },
      orderBy: { id: "asc" },
    });
    res.json(travellers);
  } catch (e) {
    console.error("❌ Admin list travellers error:", e);
    res.status(500).json({ error: "Failed to fetch travellers" });
  }
});

// POST /admin/travellers - Create a new traveller
app.post("/admin/travellers", async (req, res) => {
  try {
    const { email, password, name, busId } = req.body;
    if (!email || !password || !busId) {
      return res
        .status(400)
        .json({ error: "email, password and busId are required" });
    }
    const traveller = await prisma.traveller.create({
      data: {
        email: email.toLowerCase().trim(),
        password,
        name: name || "",
        busId: Number(busId),
      },
      include: { bus: { select: { id: true, number: true } } },
    });
    console.log(`✅ Admin created traveller: ${traveller.email}`);
    res.status(201).json(traveller);
  } catch (e) {
    if (e.code === "P2002")
      return res.status(409).json({ error: "Email already exists" });
    if (e.code === "P2003")
      return res.status(400).json({ error: "Bus not found" });
    console.error("❌ Admin create traveller error:", e);
    res.status(500).json({ error: "Failed to create traveller" });
  }
});

// PUT /admin/travellers/:id - Update a traveller
app.put("/admin/travellers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { email, password, name, busId } = req.body;
    const traveller = await prisma.traveller.update({
      where: { id },
      data: {
        ...(email !== undefined && { email: email.toLowerCase().trim() }),
        ...(password !== undefined && { password }),
        ...(name !== undefined && { name }),
        ...(busId !== undefined && { busId: Number(busId) }),
      },
      include: { bus: { select: { id: true, number: true } } },
    });
    console.log(`✅ Admin updated traveller ${id}`);
    res.json(traveller);
  } catch (e) {
    if (e.code === "P2025")
      return res.status(404).json({ error: "Traveller not found" });
    if (e.code === "P2002")
      return res.status(409).json({ error: "Email already exists" });
    console.error("❌ Admin update traveller error:", e);
    res.status(500).json({ error: "Failed to update traveller" });
  }
});

// DELETE /admin/travellers/:id - Delete a traveller
app.delete("/admin/travellers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.traveller.delete({ where: { id } });
    console.log(`✅ Admin deleted traveller ${id}`);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025")
      return res.status(404).json({ error: "Traveller not found" });
    console.error("❌ Admin delete traveller error:", e);
    res.status(500).json({ error: "Failed to delete traveller" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const ip = getLanIPv4();
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws?busId=<id>`);
  console.log(`📱 Access from phone: http://${ip}:${PORT}`);
  console.log(
    `📍 Endpoints:\n   - GET /buses\n   - GET /buses/:id\n   - GET /health\n   - POST /driver/login\n   - POST /driver/location\n   - WS /ws?busId=<id>`,
  );
});

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});

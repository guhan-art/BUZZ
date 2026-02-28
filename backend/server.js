const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const os = require("os");

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

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

// GET /buses - Returns list of all buses with basic info
app.get("/buses", async (_req, res) => {
  try {
    const buses = await prisma.bus.findMany({ include: { stops: true } });

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
      include: { stops: true },
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
app.post("/driver/login", async (req, res) => {
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

app.listen(PORT, "0.0.0.0", () => {
  const ip = getLanIPv4();
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 Access from phone: http://${ip}:${PORT}`);
  console.log(
    `📍 Endpoints:\n   - GET /buses\n   - GET /buses/:id\n   - GET /health\n   - POST /driver/login\n   - POST /driver/location`,
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

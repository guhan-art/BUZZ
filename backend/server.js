const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Get all buses
app.get("/buses", async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      orderBy: { id: "asc" },
    });
    res.json(buses);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch buses" });
  }
});

// Get a specific bus by ID including stops (ordered)
app.get("/buses/:id", async (req, res) => {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: req.params.id },
      include: { stops: { orderBy: { order: "asc" } } },
    });
    if (!bus) return res.status(404).json({ error: "Bus not found" });
    // Map to same shape the app expects: stops as string[]
    const shaped = {
      id: bus.id,
      name: bus.name,
      route: bus.route,
      departureTime: bus.departureTime,
      latitude: bus.latitude,
      longitude: bus.longitude,
      stops: bus.stops.map((s) => s.name),
    };
    res.json(shaped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch bus" });
  }
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running at: http://localhost:${PORT}`)
);

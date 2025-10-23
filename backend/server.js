const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const pool = require('./db');
const os = require('os');

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

function getLanIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net && net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Helper: parse location string "lat,lng" to {latitude, longitude}
function parseLocation(location) {
  if (!location) return { latitude: null, longitude: null };
  const [lat, lng] = location.split(',').map(Number);
  return { latitude: lat || null, longitude: lng || null };
}

// Helper: format {latitude, longitude} to "lat,lng" string
function formatLocation(latitude, longitude) {
  return `${latitude},${longitude}`;
}

app.get('/', (_req, res) => {
  res.json({
    message: '🚍 BUZZ Backend API',
    endpoints: { 
      list: '/buses', 
      details: '/buses/:id', 
      health: '/health',
      driverLogin: 'POST /driver/login',
      driverLocation: 'POST /driver/location'
    }
  });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// GET /buses - Returns list of all buses with basic info
app.get('/buses', async (_req, res) => {
  try {
    const buses = await prisma.bus.findMany({ include: { stops: true } });
    
    // Transform for bus list view (separate lat/lng for map markers)
    const transformed = buses.map(bus => {
      const { latitude, longitude } = parseLocation(bus.location);
      return {
        id: String(bus.id),
        name: bus.number,
        route: bus.route,
        latitude,
        longitude,
        stops: bus.stops.map(s => s.name), // Just stop names for list
        departureTime: "7:00 AM"
      };
    });
    
    console.log(`✅ Fetched ${buses.length} buses`);
    res.json(transformed);
  } catch (e) {
    console.error('❌ Error fetching buses:', e);
    res.status(500).json({ error: 'Failed to fetch buses' });
  }
});

// GET /buses/:id - Returns detailed bus info with location string and full stop objects
app.get('/buses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const bus = await prisma.bus.findUnique({ 
      where: { id }, 
      include: { stops: true } 
    });
    
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    
    // Return full details with location string and complete stop objects
    const transformed = {
      id: String(bus.id),
      name: bus.number,
      route: bus.route,
      location: bus.location || "0,0", // ✅ Return location as "lat,lng" string
      stops: bus.stops.map(stop => ({  // ✅ Return full stop objects with all fields
        id: stop.id,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        busId: stop.busId
      }))
    };
    
    console.log(`✅ Fetched bus ${id} with ${transformed.stops.length} stops`);
    res.json(transformed);
  } catch (e) {
    console.error('❌ Error fetching bus:', e);
    res.status(500).json({ error: 'Failed to fetch bus' });
  }
});

// POST /driver/login - Validates phone against MySQL drivers table
app.post('/driver/login', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    const [rows] = await pool.query(
      'SELECT bus_id FROM drivers WHERE phone = ? AND is_active = 1',
      [phone]
    );
    
    if (!rows || rows.length === 0) {
      console.log(`❌ Driver login failed for phone: ${phone}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const busId = String(rows[0].bus_id);
    console.log(`✅ Driver logged in: phone=${phone}, busId=${busId}`);
    res.json({ ok: true, busId });
  } catch (err) {
    console.error('❌ Driver login error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /driver/location - Updates bus location in Prisma as "lat,lng" string
app.post('/driver/location', async (req, res) => {
  try {
    const { busId, latitude, longitude } = req.body;
    
    if (!busId || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'busId, latitude and longitude required' });
    }

    const id = Number(busId);
    const locationString = formatLocation(latitude, longitude);
    
    // Update the bus location in Prisma database
    await prisma.bus.update({
      where: { id },
      data: {
        location: locationString
      }
    });

    console.log(`✅ Updated bus ${id} location: ${locationString}`);
    res.json({ ok: true });
  } catch (e) {
    console.error('❌ Error updating bus location:', e);
    
    // Bus not found
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Bus not found' });
    }
    
    res.status(500).json({ error: 'Failed to update location' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLanIPv4();
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 Access from phone: http://${ip}:${PORT}`);
  console.log(`📍 Endpoints:\n   - GET /buses\n   - GET /buses/:id\n   - GET /health\n   - POST /driver/login\n   - POST /driver/location`);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});
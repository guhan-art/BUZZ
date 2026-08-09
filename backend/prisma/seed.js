// Uses your exact data values; only structure is adjusted to match schema.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const DEFAULT_ADMIN_PASSWORD = "MyBuzz88";

const busData = [
  {
    number: "Bus 11",
    route: "Avadi - Porur Toll Gate",
    location: "13.0735,80.1649",
    stops: [
      { name: "Avadi", lat: 13.0735, lng: 80.1649 },
      { name: "Thirumullaivoyal", lat: 13.085, lng: 80.175 },
      { name: "Mogappair", lat: 13.095, lng: 80.185 },
      { name: "Porur Toll Gate", lat: 13.0349, lng: 80.1762 },
    ],
  },
  {
    number: "Bus 33",
    route: "Avichi School - Tambaram Hindu Mission",
    location: "12.9716,80.2214",
    stops: [
      { name: "Avichi School", lat: 12.9716, lng: 80.2214 },
      { name: "Vadapalani", lat: 13.0505, lng: 80.2121 },
      { name: "Guindy", lat: 13.0067, lng: 80.2206 },
      { name: "Tambaram", lat: 12.9229, lng: 80.1275 },
    ],
  },
  {
    number: "Bus 33B",
    route: "Porur Sakthi Nagar - Ramapuram (MIOT)",
    location: "13.0349,80.1762",
    stops: [
      { name: "Porur Sakthi Nagar", lat: 13.0349, lng: 80.1762 },
      { name: "Ramapuram", lat: 13.0338, lng: 80.1831 },
      { name: "MIOT Hospital", lat: 13.0293, lng: 80.1883 },
    ],
  },
  {
    number: "Bus 11B",
    route: "Waves - Golden Flats",
    location: "13.0455,80.1899",
    stops: [
      { name: "Waves", lat: 13.0455, lng: 80.1899 },
      { name: "Vanagaram", lat: 13.0772, lng: 80.1617 },
      { name: "Golden Flats", lat: 13.085, lng: 80.17 },
    ],
  },
  {
    number: "Bus 11C",
    route: "VGN Apartments - Wavin",
    location: "13.0662,80.1702",
    stops: [
      { name: "VGN Apartments", lat: 13.0662, lng: 80.1702 },
      { name: "Mogappair East", lat: 13.0707, lng: 80.1782 },
      { name: "Wavin", lat: 13.0755, lng: 80.185 },
    ],
  },
];

// Driver data: phone -> bus number mapping (use placeholder numbers)
const driverData = [
  { phone: "9994875901", busNumber: "Bus 11" },
  { phone: "9840948132", busNumber: "Bus 33B" },
  { phone: "7358536800", busNumber: "Bus 33" },
];

// Traveller data: SRMIST Gmail ID, password, name, bus number
const travellerData = [
  {
    email: "gs0172@srmist.edu.in",
    password: "srm@1",
    name: "Guhan Raj",
    busNumber: "Bus 33B",
  },
  {
    email: "av7583@srmist.edu.in",
    password: "srm@2",
    name: "Adithya Vel",
    busNumber: "Bus 33",
  },
  {
    email: "hc1427@srmist.edu.in",
    password: "srm@3",
    name: "Harish Prashanth",
    busNumber: "Bus 11",
  },
  {
    email: "rm3456@srmist.edu.in",
    password: "srm@3456",
    name: "Rahul Menon",
    busNumber: "Bus 11B",
  },
  {
    email: "dk7890@srmist.edu.in",
    password: "srm@7890",
    name: "Deepa K",
    busNumber: "Bus 11C",
  },
  {
    email: "vn2345@srmist.edu.in",
    password: "srm@2345",
    name: "Vikram N",
    busNumber: "Bus 11",
  },
  {
    email: "sj6789@srmist.edu.in",
    password: "srm@6789",
    name: "Sneha J",
    busNumber: "Bus 33",
  },
];

async function main() {
  console.log("Seeding database...");
  const adminPassword =
    (process.env.ADMIN_PASSWORD || "").trim() || DEFAULT_ADMIN_PASSWORD;

  // Delete in correct order (respect foreign keys)
  await prisma.traveller.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.adminCredential.deleteMany();

  // Seed buses with stops
  for (const bus of busData) {
    await prisma.bus.create({
      data: {
        number: bus.number,
        route: bus.route,
        location: bus.location,
        stops: { create: bus.stops },
      },
    });
  }
  console.log("✅ Seeded 5 buses with their stops");

  // Seed drivers – look up the actual bus ID by bus number
  for (const drv of driverData) {
    const bus = await prisma.bus.findFirst({
      where: { number: drv.busNumber },
    });
    if (!bus) {
      console.warn(
        `⚠ Bus "${drv.busNumber}" not found, skipping driver ${drv.phone}`,
      );
      continue;
    }
    await prisma.driver.create({
      data: {
        phone: drv.phone,
        busId: bus.id,
        isActive: true,
      },
    });
  }
  console.log("✅ Seeded 3 drivers");

  // Seed travellers – look up the actual bus ID by bus number
  for (const trv of travellerData) {
    const bus = await prisma.bus.findFirst({
      where: { number: trv.busNumber },
    });
    if (!bus) {
      console.warn(
        `⚠ Bus "${trv.busNumber}" not found, skipping traveller ${trv.email}`,
      );
      continue;
    }
    const hashedPassword = await bcrypt.hash(trv.password, SALT_ROUNDS);
    await prisma.traveller.create({
      data: {
        email: trv.email,
        password: hashedPassword,
        name: trv.name,
        busId: bus.id,
      },
    });
  }
  console.log(`✅ Seeded ${travellerData.length} travellers`);

  const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  await prisma.adminCredential.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      passwordHash: adminPasswordHash,
    },
    update: {
      passwordHash: adminPasswordHash,
    },
  });
  console.log("✅ Seeded admin credential");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

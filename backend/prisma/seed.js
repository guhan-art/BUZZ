// Uses your exact data values; only structure is adjusted to match schema.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

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
    route: "Porur Roundana - Ramapuram (MIOT)",
    location: "13.0349,80.1762",
    stops: [
      { name: "Porur", lat: 13.0349, lng: 80.1762 },
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
  { phone: "0000000001", busNumber: "Bus 11" },
  { phone: "0000000002", busNumber: "Bus 33" },
  { phone: "0000000003", busNumber: "Bus 33B" },
];

// Traveller data: SRMIST Gmail ID, password, name, bus number
const travellerData = [
  {
    email: "gs1234@srmist.edu.in",
    password: "srm@1234",
    name: "Guhan Raj S",
    busNumber: "Bus 11",
  },
  {
    email: "ak5678@srmist.edu.in",
    password: "srm@5678",
    name: "Arun Kumar",
    busNumber: "Bus 33",
  },
  {
    email: "ps9012@srmist.edu.in",
    password: "srm@9012",
    name: "Priya Sharma",
    busNumber: "Bus 33B",
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

  // Delete in correct order (respect foreign keys)
  await prisma.traveller.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.bus.deleteMany();

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
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

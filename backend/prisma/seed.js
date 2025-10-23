// Uses your exact data values; only structure is adjusted to match schema.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const busData = [
  {
    number: "Bus 11",
    route: "Avadi - Porur Toll Gate",
    location: "13.0735,80.1649",
    stops: [
      { name: "Avadi", lat: 13.0735, lng: 80.1649 },
      { name: "Thirumullaivoyal", lat: 13.0850, lng: 80.1750 },
      { name: "Mogappair", lat: 13.0950, lng: 80.1850 },
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
      { name: "Golden Flats", lat: 13.0850, lng: 80.1700 },
    ],
  },
  {
    number: "Bus 11C",
    route: "VGN Apartments - Wavin",
    location: "13.0662,80.1702",
    stops: [
      { name: "VGN Apartments", lat: 13.0662, lng: 80.1702 },
      { name: "Mogappair East", lat: 13.0707, lng: 80.1782 },
      { name: "Wavin", lat: 13.0755, lng: 80.1850 },
    ],
  },
];

async function main() {
  console.log('Seeding database...');
  await prisma.stop.deleteMany();
  await prisma.bus.deleteMany();

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
  console.log('✅ Seeded 5 buses with their stops');
}

main().catch((e) => {
  console.error('❌ Error seeding:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const busData = [
  {
    id: "1",
    name: "Bus 11",
    route: "Avadi - Porur Toll Gate",
    departureTime: "7:15 AM",
    latitude: 13.0735,
    longitude: 80.1649,
    stops: ["Avadi", "Thirumullaivoyal", "Mogappair", "Porur Toll Gate"],
  },
  {
    id: "2",
    name: "Bus 33",
    route: "Avichi School - Tambaram Hindu Mission",
    departureTime: "7:30 AM",
    latitude: 12.9716,
    longitude: 80.2214,
    stops: ["Avichi School", "Vadapalani", "Guindy", "Tambaram"],
  },
  {
    id: "3",
    name: "Bus 33B",
    route: "Porur Roundana - Ramapuram (MIOT)",
    departureTime: "7:40 AM",
    latitude: 13.0349,
    longitude: 80.1762,
    stops: ["Porur", "Ramapuram", "MIOT Hospital"],
  },
  {
    id: "4",
    name: "Bus 11B",
    route: "Waves - Golden Flats",
    departureTime: "7:50 AM",
    latitude: 13.0455,
    longitude: 80.1899,
    stops: ["Waves", "Vanagaram", "Golden Flats"],
  },
  {
    id: "5",
    name: "Bus 11C",
    route: "VGN Apartments - Wavin",
    departureTime: "8:00 AM",
    latitude: 13.0662,
    longitude: 80.1702,
    stops: ["VGN Apartments", "Mogappair East", "Wavin"],
  },
];

async function main() {
  console.log('Seeding database...');

  for (const bus of busData) {
    await prisma.bus.upsert({
      where: { id: bus.id },
      update: {},
      create: {
        id: bus.id,
        name: bus.name,
        route: bus.route,
        departureTime: bus.departureTime,
        latitude: bus.latitude,
        longitude: bus.longitude,
        stops: {
          create: bus.stops.map((name, idx) => ({ name, order: idx }))
        }
      }
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

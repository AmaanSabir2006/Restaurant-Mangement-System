const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding realistic Daily Supplies Khata records...");

  const existingCount = await prisma.dailySupply.count();
  if (existingCount > 0) {
    console.log(`Already have ${existingCount} supply records. Adding sample records if needed...`);
  }

  const sampleSupplies = [
    // Current Month (November 2026)
    {
      personName: "Ahmed",
      itemName: "Fresh Onions",
      quantity: 10,
      unit: "kg",
      totalCost: 1500,
      paymentStatus: "PAID",
      notes: "Delivered fresh red onions directly from mandi",
      monthKey: "2026-11",
      date: new Date("2026-11-01T09:30:00Z"),
    },
    {
      personName: "Ali",
      itemName: "Fresh Chicken (Boneless & Boti)",
      quantity: 18,
      unit: "kg",
      totalCost: 12600,
      paymentStatus: "PAID",
      notes: "Cleaned and washed for pizza & burger patties",
      monthKey: "2026-11",
      date: new Date("2026-11-01T10:15:00Z"),
    },
    {
      personName: "Tariq",
      itemName: "Potatoes (A-Grade)",
      quantity: 40,
      unit: "kg",
      totalCost: 2800,
      paymentStatus: "PAID",
      notes: "Large size for French fries",
      monthKey: "2026-11",
      date: new Date("2026-11-01T11:00:00Z"),
    },
    {
      personName: "Babar",
      itemName: "Shami Kabab Patties",
      quantity: 60,
      unit: "pcs",
      totalCost: 3600,
      paymentStatus: "PAID",
      notes: "Home-made recipe spiced shami patties",
      monthKey: "2026-11",
      date: new Date("2026-11-01T10:45:00Z"),
    },
    {
      personName: "City Bakers",
      itemName: "Burger Buns & Shawarma Bread",
      quantity: 150,
      unit: "pcs",
      totalCost: 4500,
      paymentStatus: "PAID",
      notes: "Fresh morning delivery batch",
      monthKey: "2026-11",
      date: new Date("2026-11-01T08:30:00Z"),
    },
    {
      personName: "Ali",
      itemName: "Chicken Drumsticks & Wings",
      quantity: 12,
      unit: "kg",
      totalCost: 7800,
      paymentStatus: "PENDING",
      notes: "Balance remaining to pay tomorrow evening",
      monthKey: "2026-11",
      date: new Date("2026-11-01T11:20:00Z"),
    },
    {
      personName: "Ahmed",
      itemName: "Tomatoes & Green Chillies",
      quantity: 8,
      unit: "kg",
      totalCost: 1200,
      paymentStatus: "PAID",
      notes: "Mandi fresh stock",
      monthKey: "2026-11",
      date: new Date("2026-11-01T09:40:00Z"),
    },
    {
      personName: "Punjab Dairy",
      itemName: "Mozzarella & Cheddar Cheese Blend",
      quantity: 15,
      unit: "kg",
      totalCost: 24000,
      paymentStatus: "PAID",
      notes: "Premium pizza cheese blocks",
      monthKey: "2026-11",
      date: new Date("2026-11-01T08:00:00Z"),
    },

    // October 2026 (Previous Month for Analytics)
    {
      personName: "Ahmed",
      itemName: "Fresh Onions",
      quantity: 60,
      unit: "kg",
      totalCost: 8400,
      paymentStatus: "PAID",
      notes: "October full supply",
      monthKey: "2026-10",
      date: new Date("2026-10-28T10:00:00Z"),
    },
    {
      personName: "Ali",
      itemName: "Fresh Chicken",
      quantity: 120,
      unit: "kg",
      totalCost: 78000,
      paymentStatus: "PAID",
      notes: "October regular supply",
      monthKey: "2026-10",
      date: new Date("2026-10-25T11:00:00Z"),
    },
    {
      personName: "Tariq",
      itemName: "Potatoes",
      quantity: 180,
      unit: "kg",
      totalCost: 12500,
      paymentStatus: "PAID",
      notes: "October fries potatoes",
      monthKey: "2026-10",
      date: new Date("2026-10-24T12:00:00Z"),
    },
    {
      personName: "Babar",
      itemName: "Shami Kabab Patties",
      quantity: 400,
      unit: "pcs",
      totalCost: 22000,
      paymentStatus: "PAID",
      notes: "October shami supply",
      monthKey: "2026-10",
      date: new Date("2026-10-26T10:00:00Z"),
    },
    {
      personName: "City Bakers",
      itemName: "Burger Buns & Shawarma Bread",
      quantity: 800,
      unit: "pcs",
      totalCost: 24000,
      paymentStatus: "PAID",
      notes: "October bread batches",
      monthKey: "2026-10",
      date: new Date("2026-10-27T08:00:00Z"),
    },
  ];

  for (const s of sampleSupplies) {
    await prisma.dailySupply.create({
      data: s,
    });
  }

  console.log(`Successfully seeded ${sampleSupplies.length} Daily Supply records!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const allOrders = await prisma.order.findMany({
    include: {
      items: {
        include: { menuItem: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(`Total orders found: ${allOrders.length}`);
  if (allOrders.length > 0) {
    console.log(`Latest order: #${allOrders[0].orderNumber}, date: ${allOrders[0].createdAt.toISOString()}, total: ${allOrders[0].totalAmount}`);
    console.log(`Items in latest order:`, allOrders[0].items.map(i => `${i.menuItem?.name || i.menuItemId} x${i.quantity}`));
  }

  const supplies = await prisma.dailySupply.findMany({
    take: 5,
    orderBy: { date: "desc" },
  });
  console.log(`Supplies count: ${supplies.length}`);
  supplies.forEach(s => console.log(`- ${s.personName}: ${s.itemName} Rs. ${s.totalCost} (${s.paymentStatus}) on ${s.date.toISOString().slice(0, 10)}`));
}

check().catch(console.error).finally(() => prisma.$disconnect());

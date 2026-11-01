const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const today = new Date("2026-11-01T00:00:00Z");
  const existingToday = await prisma.order.count({
    where: { createdAt: { gte: today } },
  });

  console.log(`Existing today's orders count: ${existingToday}`);

  // Fetch some menu items
  const menuItems = await prisma.menuItem.findMany();
  if (menuItems.length === 0) {
    console.log("No menu items found.");
    return;
  }

  const findItem = (namePart) =>
    menuItems.find((m) => m.name.toLowerCase().includes(namePart.toLowerCase())) ||
    menuItems[0];

  const pizza = findItem("tikka") || findItem("fajita") || menuItems[0];
  const zinger = findItem("zinger") || findItem("burger") || menuItems[1];
  const fries = findItem("fries") || menuItems[2];
  const shami = findItem("shami") || menuItems[3];
  const shawarma = findItem("shawarma") || menuItems[4];
  const beverage = findItem("pepsi") || findItem("coke") || menuItems[5];

  const highestOrder = await prisma.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  let nextOrderNumber = (highestOrder?.orderNumber || 100) + 1;

  const sampleOrders = [
    {
      orderNumber: nextOrderNumber++,
      orderType: "DINE_IN",
      status: "COMPLETED",
      customerName: "Kamran Akram",
      customerPhone: "0300-1122334",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      createdAt: new Date("2026-11-01T12:15:00Z"),
      items: [
        { menuItemId: pizza.id, quantity: 2, unitPrice: pizza.price },
        { menuItemId: fries.id, quantity: 2, unitPrice: fries.price },
        { menuItemId: beverage.id, quantity: 2, unitPrice: beverage.price },
      ],
    },
    {
      orderNumber: nextOrderNumber++,
      orderType: "TAKEAWAY",
      status: "COMPLETED",
      customerName: "Dr. Asif",
      customerPhone: "0321-9988776",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      createdAt: new Date("2026-11-01T13:40:00Z"),
      items: [
        { menuItemId: zinger.id, quantity: 4, unitPrice: zinger.price },
        { menuItemId: fries.id, quantity: 3, unitPrice: fries.price },
      ],
    },
    {
      orderNumber: nextOrderNumber++,
      orderType: "DELIVERY",
      status: "COMPLETED",
      customerName: "Chaudhry Bilal",
      customerPhone: "0302-5544332",
      deliveryAddress: "Near City Hospital Khichiwala",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      createdAt: new Date("2026-11-01T14:20:00Z"),
      items: [
        { menuItemId: pizza.id, quantity: 1, unitPrice: pizza.price },
        { menuItemId: shawarma.id, quantity: 3, unitPrice: shawarma.price },
        { menuItemId: beverage.id, quantity: 3, unitPrice: beverage.price },
      ],
    },
    {
      orderNumber: nextOrderNumber++,
      orderType: "DINE_IN",
      status: "COMPLETED",
      customerName: "Usman Ghani",
      customerPhone: "0345-6677889",
      paymentMethod: "CARD",
      paymentStatus: "PAID",
      createdAt: new Date("2026-11-01T15:10:00Z"),
      items: [
        { menuItemId: shami.id, quantity: 5, unitPrice: shami.price },
        { menuItemId: fries.id, quantity: 2, unitPrice: fries.price },
      ],
    },
    {
      orderNumber: nextOrderNumber++,
      orderType: "TAKEAWAY",
      status: "COMPLETED",
      customerName: "Rana Shahid",
      customerPhone: "0333-4455667",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      createdAt: new Date("2026-11-01T16:05:00Z"),
      items: [
        { menuItemId: zinger.id, quantity: 3, unitPrice: zinger.price },
        { menuItemId: shawarma.id, quantity: 2, unitPrice: shawarma.price },
        { menuItemId: fries.id, quantity: 2, unitPrice: fries.price },
      ],
    },
  ];

  for (const o of sampleOrders) {
    const subtotal = o.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const totalAmount = subtotal;

    await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        orderType: o.orderType,
        status: o.status,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        deliveryAddress: o.deliveryAddress,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        subtotal,
        totalAmount,
        createdAt: o.createdAt,
        items: {
          create: o.items.map((it) => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${sampleOrders.length} realistic orders for today (2026-11-01)!`);
}

main()
  .catch(console.error)
  .finally(() => prisma["$disconnect"]());

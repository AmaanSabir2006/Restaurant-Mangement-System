import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding fast food database with PKR prices...");

  // Clean existing data
  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.modifier.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.employee.deleteMany();

  // 1. Employees
  const empCashier = await prisma.employee.create({
    data: { name: "Alex Rivera", role: "CASHIER", pin: "1001" },
  });
  const empKitchen = await prisma.employee.create({
    data: { name: "Marco Chen", role: "KITCHEN", pin: "2001" },
  });
  const empInv = await prisma.employee.create({
    data: { name: "Sarah Jenkins", role: "INVENTORY_MGR", pin: "3001" },
  });
  const empAdmin = await prisma.employee.create({
    data: { name: "David Miller", role: "ADMIN", pin: "9999" },
  });

  // 2. Ingredients (18 comprehensive ingredients with PKR unit costs)
  const ingredientsData = [
    { name: "Brioche Sesame Bun", unit: "pcs", currentStock: 180, reorderThreshold: 45, costPerUnit: 45.0, supplier: "Golden Crust Bakery" },
    { name: "Prime Angus Beef Patty (150g)", unit: "pcs", currentStock: 120, reorderThreshold: 35, costPerUnit: 260.0, supplier: "Apex Meats Wholesale" },
    { name: "Crispy Breaded Chicken Breast", unit: "pcs", currentStock: 85, reorderThreshold: 25, costPerUnit: 210.0, supplier: "Poultry Farms Inc." },
    { name: "Plant-Based Veggie Patty", unit: "pcs", currentStock: 50, reorderThreshold: 15, costPerUnit: 190.0, supplier: "GreenRoots Organics" },
    { name: "Sharp Cheddar Cheese Slice", unit: "slices", currentStock: 250, reorderThreshold: 60, costPerUnit: 40.0, supplier: "DairyGold Creamery" },
    { name: "Smoked Bacon Rashers", unit: "strips", currentStock: 95, reorderThreshold: 30, costPerUnit: 85.0, supplier: "Apex Meats Wholesale" },
    { name: "Crispy Iceberg Lettuce", unit: "g", currentStock: 4800, reorderThreshold: 1200, costPerUnit: 0.8, supplier: "Valley Greens Produce" },
    { name: "Fresh Vine Tomatoes", unit: "g", currentStock: 3400, reorderThreshold: 800, costPerUnit: 0.6, supplier: "Valley Greens Produce" },
    { name: "Dill Pickle Slices", unit: "g", currentStock: 2600, reorderThreshold: 600, costPerUnit: 1.2, supplier: "Heritage Pantry Co." },
    { name: "Signature House Burger Sauce", unit: "ml", currentStock: 5200, reorderThreshold: 1400, costPerUnit: 1.5, supplier: "FlavorCraft Condiments" },
    { name: "Russet Cut Potato Fries", unit: "g", currentStock: 14500, reorderThreshold: 3500, costPerUnit: 0.8, supplier: "FarmCrisp Frozen" },
    { name: "Beer-Battered Onion Rings", unit: "pcs", currentStock: 22, reorderThreshold: 40, costPerUnit: 25.0, supplier: "FarmCrisp Frozen" }, // LOW STOCK!
    { name: "Mozzarella Cheese Sticks", unit: "pcs", currentStock: 130, reorderThreshold: 35, costPerUnit: 65.0, supplier: "DairyGold Creamery" },
    { name: "Draft Cola Syrup", unit: "ml", currentStock: 9200, reorderThreshold: 2000, costPerUnit: 0.9, supplier: "Metro Beverage Distribution" },
    { name: "Lemon-Lime Citrus Syrup", unit: "ml", currentStock: 6800, reorderThreshold: 1500, costPerUnit: 0.9, supplier: "Metro Beverage Distribution" },
    { name: "Creamy Soft-Serve Shake Base", unit: "ml", currentStock: 3800, reorderThreshold: 1000, costPerUnit: 1.8, supplier: "DairyGold Creamery" },
    { name: "Thermal Eco Food Wrapper", unit: "sheets", currentStock: 420, reorderThreshold: 100, costPerUnit: 8.0, supplier: "EcoPack Solutions" },
    { name: "Beverage Cup & Lid (500ml)", unit: "pcs", currentStock: 280, reorderThreshold: 60, costPerUnit: 18.0, supplier: "EcoPack Solutions" },
  ];

  const ingredientMap = new Map<string, any>();
  for (const ing of ingredientsData) {
    const created = await prisma.ingredient.create({ data: ing });
    ingredientMap.set(ing.name, created);
  }

  // Initial stock transactions for audit trail
  for (const [name, ing] of ingredientMap.entries()) {
    await prisma.stockTransaction.create({
      data: {
        ingredientId: ing.id,
        type: "RESTOCK",
        quantity: ing.currentStock,
        reason: "Initial baseline warehouse stock load",
      },
    });
  }

  // 3. Menu Items (16 Items across 5 categories with authentic PKR pricing)
  const menuItemsData = [
    // Burgers
    {
      sku: "BRG-001",
      name: "Classic Cheeseburger",
      category: "Burgers",
      price: 850,
      prepTimeMin: 4,
      calories: 580,
      description: "Flame-grilled Angus patty, melted cheddar, lettuce, tomato, pickles & signature sauce on brioche.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "BRG-002",
      name: "Double Smoky Bacon Burger",
      category: "Burgers",
      price: 1290,
      prepTimeMin: 6,
      calories: 890,
      description: "Two juicy beef patties, double smoked bacon strips, double cheddar, and rich smoky sauce.",
      image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "BRG-003",
      name: "Crispy Deluxe Chicken Burger",
      category: "Burgers",
      price: 990,
      prepTimeMin: 5,
      calories: 640,
      description: "Golden crispy chicken fillet, cheddar cheese, cool iceberg lettuce, and herb mayo.",
      image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "BRG-004",
      name: "Spicy Buffalo Chicken Crunch",
      category: "Burgers",
      price: 1090,
      prepTimeMin: 5,
      calories: 690,
      description: "Spicy fried chicken breast tossed in zesty buffalo glaze, pickles, and crispy shredded slaw.",
      image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "BRG-005",
      name: "Garden Green Veggie Burger",
      category: "Burgers",
      price: 790,
      prepTimeMin: 4,
      calories: 490,
      description: "Savory plant-based patty, crisp lettuce, ripe tomatoes, pickles, and vegan house dressing.",
      image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "BRG-006",
      name: "Triple Smash Monster Burger",
      category: "Burgers",
      price: 1590,
      prepTimeMin: 7,
      calories: 1120,
      description: "Three smashed beef patties, triple cheese, extra crispy bacon, and loaded house dressing.",
      image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&auto=format&fit=crop&q=80",
    },

    // Sides
    {
      sku: "SDE-001",
      name: "Golden Russet Fries (L)",
      category: "Sides",
      price: 450,
      prepTimeMin: 3,
      calories: 380,
      description: "Crispy outside, fluffy inside, sprinkled with sea salt flakes.",
      image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "SDE-002",
      name: "Beer-Battered Onion Rings",
      category: "Sides",
      price: 520,
      prepTimeMin: 4,
      calories: 410,
      description: "Sweet whole onion slices in crisp batter served golden with dipping sauce.",
      image: "https://images.unsplash.com/photo-1639024471285-0afc38321455?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "SDE-003",
      name: "Crispy Mozzarella Sticks (6pc)",
      category: "Sides",
      price: 690,
      prepTimeMin: 4,
      calories: 520,
      description: "Six stringy mozzarella sticks breaded in Italian herbs with marinara dip.",
      image: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "SDE-004",
      name: "Bacon Cheddar Loaded Fries",
      category: "Sides",
      price: 790,
      prepTimeMin: 5,
      calories: 680,
      description: "Steaming hot french fries smothered in warm cheese sauce and smoked bacon bits.",
      image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
    },

    // Beverages
    {
      sku: "BEV-001",
      name: "Fountain Craft Cola (500ml)",
      category: "Beverages",
      price: 250,
      prepTimeMin: 1,
      calories: 190,
      description: "Refreshing ice-cold classic craft cola served on crushed ice.",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "BEV-002",
      name: "Citrus Lemon-Lime Sparkler",
      category: "Beverages",
      price: 250,
      prepTimeMin: 1,
      calories: 170,
      description: "Zesty lemon and crisp lime carbonated fountain refresher.",
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "BEV-003",
      name: "Velvet Vanilla Thickshake",
      category: "Beverages",
      price: 590,
      prepTimeMin: 3,
      calories: 540,
      description: "Creamy thick soft-serve spun with real Madagascar bourbon vanilla.",
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
    },

    // Combos
    {
      sku: "CMB-001",
      name: "Classic Cheeseburger Combo",
      category: "Combos",
      price: 1390,
      prepTimeMin: 5,
      calories: 1150,
      description: "Includes Classic Cheeseburger + Large Golden Fries + 500ml Craft Beverage.",
      image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "CMB-002",
      name: "Double Bacon Monster Feast",
      category: "Combos",
      price: 1890,
      prepTimeMin: 7,
      calories: 1610,
      description: "Double Smoky Bacon Burger + Loaded Fries + Thickshake of your choice.",
      image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80",
    },

    // Deals
    {
      sku: "DEA-001",
      name: "Lunch Duo: Crispy Chicken & Rings",
      category: "Deals",
      price: 1550,
      prepTimeMin: 6,
      calories: 1240,
      description: "Special Deal: Crispy Deluxe Chicken Burger, Golden Onion Rings & Craft Soda.",
      image: "https://images.unsplash.com/photo-1610614819513-58e34989848b?w=600&auto=format&fit=crop&q=80",
    },
  ];

  const menuItemMap = new Map<string, any>();
  for (const item of menuItemsData) {
    const created = await prisma.menuItem.create({ data: item });
    menuItemMap.set(item.sku, created);
  }

  // 4. Modifiers with PKR pricing
  const cheeseIng = ingredientMap.get("Sharp Cheddar Cheese Slice");
  const baconIng = ingredientMap.get("Smoked Bacon Rashers");
  const pattyIng = ingredientMap.get("Prime Angus Beef Patty (150g)");
  const sauceIng = ingredientMap.get("Signature House Burger Sauce");

  const modCheddar = await prisma.modifier.create({
    data: { name: "Extra Cheddar Slice", price: 120, ingredientId: cheeseIng.id, extraQty: 1 },
  });
  const modBacon = await prisma.modifier.create({
    data: { name: "Smoked Bacon (2 strips)", price: 180, ingredientId: baconIng.id, extraQty: 2 },
  });
  const modPatty = await prisma.modifier.create({
    data: { name: "Extra Beef Patty", price: 350, ingredientId: pattyIng.id, extraQty: 1 },
  });
  const modSauce = await prisma.modifier.create({
    data: { name: "Extra Signature Sauce", price: 60, ingredientId: sauceIng.id, extraQty: 25 },
  });
  const modNoPickles = await prisma.modifier.create({
    data: { name: "No Pickles", price: 0.00 },
  });
  const modNoOnions = await prisma.modifier.create({
    data: { name: "No Onions", price: 0.00 },
  });

  // 5. Recipe BOM (Bill of Materials)
  const bun = ingredientMap.get("Brioche Sesame Bun");
  const beef = ingredientMap.get("Prime Angus Beef Patty (150g)");
  const chicken = ingredientMap.get("Crispy Breaded Chicken Breast");
  const vegPatty = ingredientMap.get("Plant-Based Veggie Patty");
  const cheddar = ingredientMap.get("Sharp Cheddar Cheese Slice");
  const bacon = ingredientMap.get("Smoked Bacon Rashers");
  const lettuce = ingredientMap.get("Crispy Iceberg Lettuce");
  const tomato = ingredientMap.get("Fresh Vine Tomatoes");
  const pickles = ingredientMap.get("Dill Pickle Slices");
  const sauce = ingredientMap.get("Signature House Burger Sauce");
  const fries = ingredientMap.get("Russet Cut Potato Fries");
  const rings = ingredientMap.get("Beer-Battered Onion Rings");
  const mozz = ingredientMap.get("Mozzarella Cheese Sticks");
  const cola = ingredientMap.get("Draft Cola Syrup");
  const lemon = ingredientMap.get("Lemon-Lime Citrus Syrup");
  const shake = ingredientMap.get("Creamy Soft-Serve Shake Base");
  const wrapper = ingredientMap.get("Thermal Eco Food Wrapper");
  const cup = ingredientMap.get("Beverage Cup & Lid (500ml)");

  const recipes = [
    // Classic Cheeseburger
    { sku: "BRG-001", ings: [
      { ing: bun, qty: 1 }, { ing: beef, qty: 1 }, { ing: cheddar, qty: 1 },
      { ing: lettuce, qty: 25 }, { ing: tomato, qty: 25 }, { ing: pickles, qty: 15 },
      { ing: sauce, qty: 20 }, { ing: wrapper, qty: 1 }
    ]},
    // Double Smoky Bacon Burger
    { sku: "BRG-002", ings: [
      { ing: bun, qty: 1 }, { ing: beef, qty: 2 }, { ing: cheddar, qty: 2 },
      { ing: bacon, qty: 2 }, { ing: sauce, qty: 30 }, { ing: wrapper, qty: 1 }
    ]},
    // Crispy Deluxe Chicken Burger
    { sku: "BRG-003", ings: [
      { ing: bun, qty: 1 }, { ing: chicken, qty: 1 }, { ing: cheddar, qty: 1 },
      { ing: lettuce, qty: 30 }, { ing: sauce, qty: 20 }, { ing: wrapper, qty: 1 }
    ]},
    // Spicy Buffalo Chicken
    { sku: "BRG-004", ings: [
      { ing: bun, qty: 1 }, { ing: chicken, qty: 1 }, { ing: pickles, qty: 20 },
      { ing: lettuce, qty: 25 }, { ing: sauce, qty: 25 }, { ing: wrapper, qty: 1 }
    ]},
    // Garden Green Veggie
    { sku: "BRG-005", ings: [
      { ing: bun, qty: 1 }, { ing: vegPatty, qty: 1 }, { ing: lettuce, qty: 35 },
      { ing: tomato, qty: 30 }, { ing: pickles, qty: 15 }, { ing: sauce, qty: 20 },
      { ing: wrapper, qty: 1 }
    ]},
    // Triple Smash Monster
    { sku: "BRG-006", ings: [
      { ing: bun, qty: 1 }, { ing: beef, qty: 3 }, { ing: cheddar, qty: 3 },
      { ing: bacon, qty: 3 }, { ing: sauce, qty: 40 }, { ing: wrapper, qty: 1 }
    ]},
    // Golden Fries
    { sku: "SDE-001", ings: [
      { ing: fries, qty: 220 }, { ing: wrapper, qty: 1 }
    ]},
    // Onion Rings
    { sku: "SDE-002", ings: [
      { ing: rings, qty: 8 }, { ing: sauce, qty: 25 }, { ing: wrapper, qty: 1 }
    ]},
    // Mozzarella Sticks
    { sku: "SDE-003", ings: [
      { ing: mozz, qty: 6 }, { ing: sauce, qty: 30 }, { ing: wrapper, qty: 1 }
    ]},
    // Bacon Cheddar Loaded Fries
    { sku: "SDE-004", ings: [
      { ing: fries, qty: 220 }, { ing: cheddar, qty: 2 }, { ing: bacon, qty: 2 },
      { ing: wrapper, qty: 1 }
    ]},
    // Fountain Cola
    { sku: "BEV-001", ings: [
      { ing: cola, qty: 60 }, { ing: cup, qty: 1 }
    ]},
    // Lemon-Lime
    { sku: "BEV-002", ings: [
      { ing: lemon, qty: 60 }, { ing: cup, qty: 1 }
    ]},
    // Thickshake
    { sku: "BEV-003", ings: [
      { ing: shake, qty: 300 }, { ing: cup, qty: 1 }
    ]},
    // Combo 1
    { sku: "CMB-001", ings: [
      { ing: bun, qty: 1 }, { ing: beef, qty: 1 }, { ing: cheddar, qty: 1 },
      { ing: lettuce, qty: 25 }, { ing: sauce, qty: 20 }, { ing: fries, qty: 180 },
      { ing: cola, qty: 60 }, { ing: cup, qty: 1 }, { ing: wrapper, qty: 2 }
    ]},
    // Combo 2
    { sku: "CMB-002", ings: [
      { ing: bun, qty: 1 }, { ing: beef, qty: 2 }, { ing: cheddar, qty: 2 },
      { ing: bacon, qty: 2 }, { ing: sauce, qty: 30 }, { ing: fries, qty: 220 },
      { ing: shake, qty: 300 }, { ing: cup, qty: 1 }, { ing: wrapper, qty: 2 }
    ]},
    // Deal 1
    { sku: "DEA-001", ings: [
      { ing: bun, qty: 1 }, { ing: chicken, qty: 1 }, { ing: cheddar, qty: 1 },
      { ing: rings, qty: 6 }, { ing: cola, qty: 60 }, { ing: cup, qty: 1 },
      { ing: wrapper, qty: 2 }
    ]},
  ];

  for (const recipe of recipes) {
    const item = menuItemMap.get(recipe.sku);
    if (!item) continue;
    for (const r of recipe.ings) {
      await prisma.recipeItem.create({
        data: {
          menuItemId: item.id,
          ingredientId: r.ing.id,
          quantityRequired: r.qty,
        },
      });
    }
  }

  // 6. 5 Dummy Active Orders in PKR
  const now = new Date();

  // Order #101: PENDING (Drive-Thru, placed 2 mins ago)
  await prisma.order.create({
    data: {
      orderNumber: 101,
      orderType: "DRIVE_THRU",
      status: "PENDING",
      subtotal: 1300,
      tax: 104,
      discount: 0,
      serviceCharge: 0,
      totalAmount: 1404,
      paymentMethod: "CARD",
      paymentStatus: "PAID",
      customerName: "Car #3 (Silver Sedan)",
      notes: "Extra napkins in bag",
      employeeId: empCashier.id,
      createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 mins ago
      items: {
        create: [
          {
            menuItemId: menuItemMap.get("BRG-001").id,
            quantity: 1,
            unitPrice: 850,
            notes: "Well-done",
          },
          {
            menuItemId: menuItemMap.get("SDE-001").id,
            quantity: 1,
            unitPrice: 450,
          },
        ],
      },
    },
  });

  // Order #102: PREPARING (Dine-In, placed 7 mins ago -> Yellow alert)
  await prisma.order.create({
    data: {
      orderNumber: 102,
      orderType: "DINE_IN",
      status: "PREPARING",
      subtotal: 3080,
      tax: 246,
      discount: 200,
      serviceCharge: 100,
      totalAmount: 3226,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      customerName: "Table 7 (Hamza K.)",
      prepStartTime: new Date(now.getTime() - 6 * 60 * 1000),
      createdAt: new Date(now.getTime() - 7 * 60 * 1000),
      employeeId: empCashier.id,
      items: {
        create: [
          {
            menuItemId: menuItemMap.get("BRG-002").id,
            quantity: 2,
            unitPrice: 1290,
            notes: "No onions please",
          },
          {
            menuItemId: menuItemMap.get("BEV-001").id,
            quantity: 2,
            unitPrice: 250,
          },
        ],
      },
    },
  });

  // Order #103: PREPARING (Takeaway, placed 13 mins ago -> RED alert > 10 min)
  const o103 = await prisma.order.create({
    data: {
      orderNumber: 103,
      orderType: "TAKEAWAY",
      status: "PREPARING",
      subtotal: 1860,
      tax: 149,
      discount: 0,
      serviceCharge: 0,
      totalAmount: 2009,
      paymentMethod: "QR_MOBILE",
      paymentStatus: "PAID",
      customerName: "Zainab Tariq",
      prepStartTime: new Date(now.getTime() - 11 * 60 * 1000),
      createdAt: new Date(now.getTime() - 13 * 60 * 1000),
      employeeId: empCashier.id,
    },
  });

  const o103Item1 = await prisma.orderItem.create({
    data: {
      orderId: o103.id,
      menuItemId: menuItemMap.get("BRG-003").id,
      quantity: 1,
      unitPrice: 990,
      notes: "Crispy chicken extra crunchy",
    },
  });

  await prisma.orderItemModifier.create({
    data: {
      orderItemId: o103Item1.id,
      modifierId: modBacon.id,
      name: "Smoked Bacon (2 strips)",
      price: 180,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: o103.id,
      menuItemId: menuItemMap.get("SDE-003").id,
      quantity: 1,
      unitPrice: 690,
    },
  });

  // Order #104: READY (Dine-in, ready for pickup)
  await prisma.order.create({
    data: {
      orderNumber: 104,
      orderType: "DINE_IN",
      status: "READY",
      subtotal: 1390,
      tax: 111,
      discount: 0,
      serviceCharge: 0,
      totalAmount: 1501,
      paymentMethod: "CARD",
      paymentStatus: "PAID",
      customerName: "Table 3 (Bilal)",
      prepStartTime: new Date(now.getTime() - 15 * 60 * 1000),
      readyTime: new Date(now.getTime() - 2 * 60 * 1000),
      createdAt: new Date(now.getTime() - 16 * 60 * 1000),
      employeeId: empCashier.id,
      items: {
        create: [
          {
            menuItemId: menuItemMap.get("CMB-001").id,
            quantity: 1,
            unitPrice: 1390,
          },
        ],
      },
    },
  });

  // Order #105: COMPLETED (Delivery)
  await prisma.order.create({
    data: {
      orderNumber: 105,
      orderType: "DELIVERY",
      status: "COMPLETED",
      subtotal: 3440,
      tax: 275,
      discount: 300,
      serviceCharge: 150,
      totalAmount: 3565,
      paymentMethod: "QR_MOBILE",
      paymentStatus: "PAID",
      customerName: "FoodPanda #7721 (Farhan A.)",
      notes: "Call upon arrival",
      prepStartTime: new Date(now.getTime() - 35 * 60 * 1000),
      readyTime: new Date(now.getTime() - 22 * 60 * 1000),
      completedTime: new Date(now.getTime() - 8 * 60 * 1000),
      createdAt: new Date(now.getTime() - 38 * 60 * 1000),
      employeeId: empCashier.id,
      items: {
        create: [
          {
            menuItemId: menuItemMap.get("CMB-002").id,
            quantity: 1,
            unitPrice: 1890,
          },
          {
            menuItemId: menuItemMap.get("DEA-001").id,
            quantity: 1,
            unitPrice: 1550,
          },
        ],
      },
    },
  });

  // 7. Purchase Order in PKR
  await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-0041",
      supplier: "FarmCrisp Frozen",
      totalCost: 18500.0,
      status: "PENDING",
      notes: "Emergency restock of onion rings and fries batch",
      items: {
        create: [
          {
            ingredientId: rings.id,
            quantity: 100,
            unitCost: 25.0,
          },
          {
            ingredientId: fries.id,
            quantity: 20000,
            unitCost: 0.8,
          },
        ],
      },
    },
  });

  console.log("Database seeded successfully with authentic PKR pricing!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

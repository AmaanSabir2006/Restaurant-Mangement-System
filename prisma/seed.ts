import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PIZZA WORLD AND SANAM ICECREAM (Khichiwala) with size options...");

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
    data: { name: "M. Hamza", role: "CASHIER", pin: "1001" },
  });
  const empKitchen = await prisma.employee.create({
    data: { name: "Ustad Rashid", role: "KITCHEN", pin: "2001" },
  });
  const empInv = await prisma.employee.create({
    data: { name: "Tariq Mahmood", role: "INVENTORY_MGR", pin: "3001" },
  });
  const empAdmin = await prisma.employee.create({
    data: { name: "Malik Nadeem", role: "ADMIN", pin: "9999" },
  });

  // 2. Ingredients
  const ingredientsData = [
    { name: "Pizza Dough Ball (Small)", unit: "pcs", currentStock: 150, reorderThreshold: 30, costPerUnit: 60.0, supplier: "Khichiwala Flour Mills" },
    { name: "Pizza Dough Ball (Medium)", unit: "pcs", currentStock: 120, reorderThreshold: 25, costPerUnit: 95.0, supplier: "Khichiwala Flour Mills" },
    { name: "Pizza Dough Ball (Large)", unit: "pcs", currentStock: 140, reorderThreshold: 30, costPerUnit: 140.0, supplier: "Khichiwala Flour Mills" },
    { name: "Pizza Dough Ball (X-Large)", unit: "pcs", currentStock: 80, reorderThreshold: 20, costPerUnit: 180.0, supplier: "Khichiwala Flour Mills" },
    { name: "Mozzarella & Cheddar Pizza Cheese Blend", unit: "g", currentStock: 25000, reorderThreshold: 4000, costPerUnit: 2.2, supplier: "Dairy King Farm Produce" },
    { name: "Pizza World Secret Pizza Sauce", unit: "ml", currentStock: 12000, reorderThreshold: 2000, costPerUnit: 1.1, supplier: "SpiceCraft Sauce Co." },
    { name: "Marinated Chicken Tikka Chunks", unit: "g", currentStock: 16000, reorderThreshold: 3000, costPerUnit: 1.6, supplier: "Al-Madina Fresh Poultry" },
    { name: "Chicken Malai Boti Chunks", unit: "g", currentStock: 11000, reorderThreshold: 2000, costPerUnit: 1.8, supplier: "Al-Madina Fresh Poultry" },
    { name: "Crispy Zinger Chicken Fillet", unit: "pcs", currentStock: 180, reorderThreshold: 35, costPerUnit: 120.0, supplier: "Al-Madina Fresh Poultry" },
    { name: "Chicken Drumsticks & Wings", unit: "pcs", currentStock: 300, reorderThreshold: 60, costPerUnit: 45.0, supplier: "Al-Madina Fresh Poultry" },
    { name: "Burger Buns Sesame", unit: "pcs", currentStock: 220, reorderThreshold: 50, costPerUnit: 25.0, supplier: "Khichiwala City Bakers" },
    { name: "Fresh Shawarma Pita Bread", unit: "pcs", currentStock: 200, reorderThreshold: 40, costPerUnit: 18.0, supplier: "Khichiwala City Bakers" },
    { name: "Lachha Paratha Dough", unit: "pcs", currentStock: 150, reorderThreshold: 30, costPerUnit: 35.0, supplier: "Khichiwala City Bakers" },
    { name: "French Fries Cut Potatoes", unit: "g", currentStock: 25000, reorderThreshold: 5000, costPerUnit: 0.6, supplier: "Punjab Agro Farms" },
    { name: "Penne & Macaroni Pasta", unit: "g", currentStock: 10000, reorderThreshold: 1800, costPerUnit: 0.9, supplier: "National Food Wholesale" },
    { name: "Sanam Pure Milk Kulfa Base", unit: "ml", currentStock: 15000, reorderThreshold: 2500, costPerUnit: 1.3, supplier: "Sanam Dairy Khichiwala" },
    { name: "Soft Drink Bottles", unit: "pcs", currentStock: 220, reorderThreshold: 40, costPerUnit: 70.0, supplier: "Beverage Distributors Lodhran" },
    { name: "Thermal Receipt Paper & Food Wrap", unit: "sheets", currentStock: 800, reorderThreshold: 100, costPerUnit: 5.0, supplier: "Malik Nadeem Printing Press" },
  ];

  const ingredientMap = new Map<string, any>();
  for (const ing of ingredientsData) {
    const created = await prisma.ingredient.create({ data: ing });
    ingredientMap.set(ing.name, created);
  }

  // Stock transactions
  for (const [, ing] of ingredientMap.entries()) {
    await prisma.stockTransaction.create({
      data: {
        ingredientId: ing.id,
        type: "RESTOCK",
        quantity: ing.currentStock,
        reason: "Initial warehouse inventory balance (Highway Road Khichiwala)",
      },
    });
  }

  // 3. Menu Items (Deals 1-20, Pizza Flavors with sizes, Burgers, Shawarma, Fried Chicken, Sides, Pastas, Ice Creams)
  const menuItemsData: Array<{
    sku: string;
    name: string;
    category: string;
    price: number;
    sizes?: string; // JSON string of size options
    prepTimeMin: number;
    calories?: number;
    description: string;
    image: string;
  }> = [
    // ==========================================
    // HOT DEALS (1 to 20 from Flyer)
    // ==========================================
    { sku: "DEA-001", name: "Deal No: 1", category: "Hot Deals", price: 650, prepTimeMin: 8, calories: 780, description: "1 Zinger Burger, 1 Drum Piece, 500 ml Bottle", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-002", name: "Deal No: 2", category: "Hot Deals", price: 750, prepTimeMin: 12, calories: 920, description: "1 Small Pizza, Regular Fries, 1 Ltr. Bottle", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-003", name: "Deal No: 3", category: "Hot Deals", price: 1150, prepTimeMin: 14, calories: 1450, description: "1 Small Pizza, 2 Zinger Burger, 1 Ltr. Bottle", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-004", name: "Deal No: 4", category: "Hot Deals", price: 1600, prepTimeMin: 15, calories: 1850, description: "1 Medium Pizza, 2 Zinger Burger, 1 Ltr. Bottle", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-005", name: "Deal No: 5", category: "Hot Deals", price: 1900, prepTimeMin: 16, calories: 2100, description: "1 Large Pizza, 10 Hot Wings, 1.5 Ltr. Bottle", image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-006", name: "Deal No: 6", category: "Hot Deals", price: 1350, prepTimeMin: 10, calories: 1920, description: "4 Zinger Burger, 1.5 Ltr. Bottle", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-007", name: "Deal No: 7", category: "Hot Deals", price: 2250, prepTimeMin: 15, calories: 2580, description: "4 Zinger Burger, 10 Hot Wings, 1.5 Ltr. Bottle", image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-008", name: "Deal No: 8", category: "Hot Deals", price: 1600, prepTimeMin: 15, calories: 1900, description: "2 Medium Pizza, 1 Ltr. Bottle", image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-009", name: "Deal No: 9", category: "Hot Deals", price: 1050, prepTimeMin: 10, calories: 1100, description: "10 Hot Wings, 10 Nuggets, 1 Ltr. Bottle", image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-010", name: "Deal No: 10", category: "Hot Deals", price: 750, prepTimeMin: 10, calories: 820, description: "Special Pasta, 500 ml Bottle", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-011", name: "Deal No: 11", category: "Hot Deals", price: 1700, prepTimeMin: 15, calories: 1950, description: "1 Large Pizza, 5 Hot Wings, 1.5 Ltr. Bottle", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-012", name: "Deal No: 12", category: "Hot Deals", price: 1350, prepTimeMin: 12, calories: 1650, description: "2 Small Pizza, 5 Hot Wings, 1 Ltr. Bottle", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-013", name: "Deal No: 13", category: "Hot Deals", price: 2750, prepTimeMin: 18, calories: 2800, description: "2 Large Pizza, Regular Fries, 1.5 Ltr. Bottle", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-014", name: "Deal No: 14", category: "Hot Deals", price: 1550, prepTimeMin: 14, calories: 2100, description: "5 Chicken Shawarma, 5 Shami Burger, 1.5 Ltr. Bottle", image: "https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-015", name: "Deal No: 15", category: "Hot Deals", price: 3850, prepTimeMin: 22, calories: 4200, description: "2 Large Pizza, 2 Zinger Burger, 2 Chicken Burger, 5 Hot Wings, 1.5 Ltr. Bottle", image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-016", name: "Deal No: 16", category: "Hot Deals", price: 1450, prepTimeMin: 15, calories: 1750, description: "1 Large Pizza, 1 Ltr. Bottle", image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-017", name: "Deal No: 17", category: "Hot Deals", price: 2550, prepTimeMin: 18, calories: 2600, description: "2 Medium Any Pizza, 10 Hot Wings, 1 Ltr. Bottle", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-018", name: "Deal No: 18", category: "Hot Deals", price: 2600, prepTimeMin: 20, calories: 2900, description: "1 Large Pizza, 1 Medium Pizza, 1 Small Pizza, 1.5 Ltr. Bottle", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-019", name: "Deal No: 19", category: "Hot Deals", price: 3100, prepTimeMin: 22, calories: 3400, description: "1 Large Deep Dish Pizza, 2 Pound Cake, 10 Hot Wings, 1.5 Ltr. Bottle", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80" },
    { sku: "DEA-020", name: "Deal No: 20", category: "Hot Deals", price: 5050, prepTimeMin: 25, calories: 5600, description: "2 Large Pizza, 3 Zinger Burger, 10 Nuggets, 20 Hot Wings, 2.25 Ltr. Bottle", image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=80" },

    // ==========================================
    // SPECIAL PIZZA FLAVOR'S (Grouped by Flavor with Small/Medium/Large/X-Large options!)
    // ==========================================
    {
      sku: "PIZ-001",
      name: "P.W. Special Pizza",
      category: "Pizzas",
      price: 600,
      sizes: JSON.stringify([
        { name: "Small", price: 600 },
        { name: "Medium", price: 1050 },
        { name: "Large", price: 1500 },
        { name: "X-Large", price: 2000 },
      ]),
      prepTimeMin: 15,
      description: "Pizza World signature special blend with marinated chicken, mushrooms, black olives & extra cheese.",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-002",
      name: "Matka Pizza",
      category: "Pizzas",
      price: 700,
      sizes: JSON.stringify([
        { name: "Small", price: 700 },
        { name: "Medium", price: 1000 },
        { name: "Large", price: 1300 },
      ]),
      prepTimeMin: 16,
      description: "Claypot baked bubbling hot cheese pizza with smoked chicken chunks and secret spices.",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-003",
      name: "Lazania Pizza",
      category: "Pizzas",
      price: 650,
      sizes: JSON.stringify([
        { name: "Small", price: 650 },
        { name: "Medium", price: 1150 },
        { name: "Large", price: 1550 },
        { name: "X-Large", price: 2100 },
      ]),
      prepTimeMin: 16,
      description: "Layered lasagna meat sauce, creamy white sauce and mozzarella baked over crispy pizza crust.",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-004",
      name: "Bone Fire Pizza",
      category: "Pizzas",
      price: 650,
      sizes: JSON.stringify([
        { name: "Small", price: 650 },
        { name: "Medium", price: 950 },
        { name: "Large", price: 1450 },
        { name: "X-Large", price: 2050 },
      ]),
      prepTimeMin: 15,
      description: "Fiery spicy chicken, jalapenos, chili flakes and flame roasted capsicum.",
      image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-005",
      name: "Royal Kabab Pizza",
      category: "Pizzas",
      price: 650,
      sizes: JSON.stringify([
        { name: "Small", price: 650 },
        { name: "Medium", price: 1000 },
        { name: "Large", price: 1450 },
        { name: "X-Large", price: 1950 },
      ]),
      prepTimeMin: 15,
      description: "Succulent seekh kabab bites with sliced onions, bell peppers and royal spices.",
      image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-006",
      name: "Crown Crust Pizza",
      category: "Pizzas",
      price: 600,
      sizes: JSON.stringify([
        { name: "Small", price: 600 },
        { name: "Medium", price: 1100 },
        { name: "Large", price: 1550 },
        { name: "X-Large", price: 2000 },
      ]),
      prepTimeMin: 16,
      description: "Crown pocket crust stuffed with cream cheese and topped with spicy chicken boti.",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-007",
      name: "Sami Behari Pizza",
      category: "Pizzas",
      price: 550,
      sizes: JSON.stringify([
        { name: "Small", price: 550 },
        { name: "Medium", price: 950 },
        { name: "Large", price: 1450 },
        { name: "X-Large", price: 1999 },
      ]),
      prepTimeMin: 15,
      description: "Melt-in-mouth marinated Bihari chicken with caramelized onions and cilantro.",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-008",
      name: "Chi Malai Boti Pizza",
      category: "Pizzas",
      price: 600,
      sizes: JSON.stringify([
        { name: "Small", price: 600 },
        { name: "Medium", price: 1100 },
        { name: "Large", price: 1550 },
        { name: "X-Large", price: 2100 },
      ]),
      prepTimeMin: 15,
      description: "Creamy cardamom spiced Malai boti chicken chunks, mushrooms and extra mozzarella.",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-009",
      name: "Behari Pizza",
      category: "Pizzas",
      price: 600,
      sizes: JSON.stringify([
        { name: "Small", price: 600 },
        { name: "Medium", price: 850 },
        { name: "Large", price: 1450 },
        { name: "X-Large", price: 1900 },
      ]),
      prepTimeMin: 15,
      description: "Smoky Bihari chicken with aromatic masala, onion rings and green pepper.",
      image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-010",
      name: "Newabi Pizza",
      category: "Pizzas",
      price: 550,
      sizes: JSON.stringify([
        { name: "Small", price: 550 },
        { name: "Medium", price: 1000 },
        { name: "Large", price: 1350 },
        { name: "X-Large", price: 1850 },
      ]),
      prepTimeMin: 15,
      description: "Nawabi spiced chicken, golden sweet corn, capsicum and creamy sauce.",
      image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-011",
      name: "Mughlai Pizza",
      category: "Pizzas",
      price: 550,
      sizes: JSON.stringify([
        { name: "Small", price: 550 },
        { name: "Medium", price: 950 },
        { name: "Large", price: 1450 },
        { name: "X-Large", price: 1900 },
      ]),
      prepTimeMin: 15,
      description: "Mughlai style slow-cooked butter chicken with almonds, raisins and herbs.",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-012",
      name: "Chi Supreme Pizza",
      category: "Pizzas",
      price: 500,
      sizes: JSON.stringify([
        { name: "Small", price: 500 },
        { name: "Medium", price: 900 },
        { name: "Large", price: 1300 },
        { name: "X-Large", price: 1800 },
      ]),
      prepTimeMin: 15,
      description: "Loaded supreme chicken, beef pepperoni, mushrooms, capsicum and black olives.",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-013",
      name: "Kalzone Pizza",
      category: "Pizzas",
      price: 950,
      sizes: JSON.stringify([
        { name: "Medium", price: 950 },
        { name: "Large", price: 1450 },
        { name: "X-Large", price: 1900 },
      ]),
      prepTimeMin: 16,
      description: "Folded Italian turnover stuffed with mozzarella, ricotta, chicken tikka and marinara.",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-014",
      name: "Dip Dish Pizza",
      category: "Pizzas",
      price: 600,
      sizes: JSON.stringify([
        { name: "Small", price: 600 },
        { name: "Medium", price: 950 },
        { name: "Large", price: 1450 },
      ]),
      prepTimeMin: 18,
      description: "Chicago style high-crust deep dish pizza filled with thick layers of cheese & sauce.",
      image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-015",
      name: "Piproni Pizza",
      category: "Pizzas",
      price: 950,
      sizes: JSON.stringify([
        { name: "Medium", price: 950 },
        { name: "Large", price: 1499 },
        { name: "X-Large", price: 2000 },
      ]),
      prepTimeMin: 14,
      description: "Classic pepperoni slices layered generously over melted mozzarella.",
      image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-016",
      name: "2 In 1 Pizza",
      category: "Pizzas",
      price: 950,
      sizes: JSON.stringify([
        { name: "Medium", price: 950 },
        { name: "Large", price: 1500 },
        { name: "X-Large", price: 2000 },
      ]),
      prepTimeMin: 16,
      description: "Half and half split pizza featuring two of your favorite toppings on one crust.",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-017",
      name: "Achari Pizza",
      category: "Pizzas",
      price: 450,
      sizes: JSON.stringify([
        { name: "Small", price: 450 },
        { name: "Medium", price: 900 },
        { name: "Large", price: 1350 },
      ]),
      prepTimeMin: 14,
      description: "Tangy pickle-spiced chicken, green peppers and authentic achar masala.",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-018",
      name: "B.B.Q Pizza",
      category: "Pizzas",
      price: 500,
      sizes: JSON.stringify([
        { name: "Small", price: 500 },
        { name: "Medium", price: 900 },
        { name: "Large", price: 1350 },
        { name: "X-Large", price: 1800 },
      ]),
      prepTimeMin: 15,
      description: "Smoky sweet BBQ sauce base, grilled chicken, sliced red onion and coriander.",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-019",
      name: "Peri Peri Pizza",
      category: "Pizzas",
      price: 450,
      sizes: JSON.stringify([
        { name: "Small", price: 450 },
        { name: "Medium", price: 850 },
        { name: "Large", price: 1250 },
        { name: "X-Large", price: 1850 },
      ]),
      prepTimeMin: 14,
      description: "Zesty African bird's eye peri-peri chili chicken with capsicum and herbs.",
      image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-020",
      name: "Tandori Pizza",
      category: "Pizzas",
      price: 450,
      sizes: JSON.stringify([
        { name: "Small", price: 450 },
        { name: "Medium", price: 850 },
        { name: "Large", price: 1250 },
        { name: "X-Large", price: 1800 },
      ]),
      prepTimeMin: 14,
      description: "Clay oven spiced tandoori chicken, onion rings, capsicum & cheese.",
      image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-021",
      name: "Tikka Pizza",
      category: "Pizzas",
      price: 450,
      sizes: JSON.stringify([
        { name: "Small", price: 450 },
        { name: "Medium", price: 850 },
        { name: "Large", price: 1250 },
        { name: "X-Large", price: 1850 },
      ]),
      prepTimeMin: 14,
      description: "Traditional Pakistani chicken tikka chunks with onions and mozzarella.",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-022",
      name: "Fajita Pizza",
      category: "Pizzas",
      price: 450,
      sizes: JSON.stringify([
        { name: "Small", price: 450 },
        { name: "Medium", price: 850 },
        { name: "Large", price: 1250 },
        { name: "X-Large", price: 1850 },
      ]),
      prepTimeMin: 14,
      description: "Mexican spiced fajita chicken, green bell peppers, sweet onions and cheddar blend.",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-023",
      name: "Cheese Lover Pizza",
      category: "Pizzas",
      price: 450,
      sizes: JSON.stringify([
        { name: "Small", price: 450 },
        { name: "Medium", price: 850 },
        { name: "Large", price: 1250 },
        { name: "X-Large", price: 1800 },
      ]),
      prepTimeMin: 12,
      description: "Double layer of imported mozzarella, yellow cheddar and parmesan with herb drizzle.",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-024",
      name: "Vegitable Pizza",
      category: "Pizzas",
      price: 400,
      sizes: JSON.stringify([
        { name: "Small", price: 400 },
        { name: "Medium", price: 800 },
        { name: "Large", price: 1100 },
      ]),
      prepTimeMin: 12,
      description: "Garden fresh mushrooms, sweet bell peppers, onions, tomatoes and olives.",
      image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-025",
      name: "Hot And Spicy Pizza",
      category: "Pizzas",
      price: 400,
      sizes: JSON.stringify([
        { name: "Small", price: 400 },
        { name: "Medium", price: 800 },
        { name: "Large", price: 1100 },
      ]),
      prepTimeMin: 12,
      description: "Fiery crushed chili flakes, jalapenos, spicy tomato sauce and mozzarella.",
      image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-026",
      name: "Afghani Pizza",
      category: "Pizzas",
      price: 550,
      sizes: JSON.stringify([
        { name: "Small", price: 550 },
        { name: "Medium", price: 950 },
        { name: "Large", price: 1450 },
        { name: "X-Large", price: 2000 },
      ]),
      prepTimeMin: 15,
      description: "Mildly spiced Afghani cream chicken boti with coriander and mozzarella.",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-027",
      name: "Karanchi Pizza",
      category: "Pizzas",
      price: 600,
      sizes: JSON.stringify([
        { name: "Small", price: 600 },
        { name: "Medium", price: 1000 },
        { name: "Large", price: 1550 },
      ]),
      prepTimeMin: 15,
      description: "Karachi style spicy street chatkhara chicken, green chilies, mint dip drizzle & cheese.",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-028",
      name: "Double Topping Pizza",
      category: "Pizzas",
      price: 900,
      sizes: JSON.stringify([
        { name: "Small", price: 900 },
        { name: "Medium", price: 1500 },
        { name: "Large", price: 2100 },
        { name: "X-Large", price: 2600 },
      ]),
      prepTimeMin: 17,
      description: "Double loaded portion of premium chicken toppings, double cheese and rich sauce.",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PIZ-029",
      name: "Train Pizza & Family Pizza + 1.5 Litter Drink",
      category: "Pizzas",
      price: 3100,
      prepTimeMin: 25,
      calories: 3800,
      description: "Grand rectangular Train Pizza & Round Family Pizza bundle accompanied by chilled 1.5 Liter Drink.",
      image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=80",
    },

    // ==========================================
    // HOT BURGER'S
    // ==========================================
    { sku: "BRG-001", name: "Zinger Burger", category: "Burgers", price: 300, prepTimeMin: 6, calories: 520, description: "Golden crispy fried zinger chicken fillet with shredded lettuce and creamy mayo on toasted bun.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-002", name: "Petty Burger", category: "Burgers", price: 250, prepTimeMin: 5, calories: 460, description: "Seasoned ground chicken patty with fresh lettuce, onions and signature house sauce.", image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-003", name: "Zinger Cheese Burger", category: "Burgers", price: 350, prepTimeMin: 6, calories: 580, description: "Crispy zinger chicken breast fillet crowned with a rich slice of melted cheddar cheese.", image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-004", name: "Tower Burger", category: "Burgers", price: 450, prepTimeMin: 8, calories: 780, description: "High-stack double zinger chicken patty, cheese, crisp hashbrown and savory sauce.", image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-005", name: "Chapli Burger", category: "Burgers", price: 280, prepTimeMin: 7, calories: 510, description: "Authentic spiced Peshawari chapli kabab patty, sliced tomatoes, onions and green chutney.", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-006", name: "Chicken Burger", category: "Burgers", price: 200, prepTimeMin: 5, calories: 430, description: "Tender seasoned chicken patty with crisp lettuce and light pepper mayo.", image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-007", name: "Double Egg Burger", category: "Burgers", price: 150, prepTimeMin: 4, calories: 380, description: "Double fresh skillet-fried spiced eggs layered with sweet and spicy chutney.", image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-008", name: "Shami Burger", category: "Burgers", price: 130, prepTimeMin: 4, calories: 340, description: "Traditional aromatic chicken-chana daal shami kabab pan-toasted with beaten egg.", image: "https://images.unsplash.com/photo-1521305916504-4a1121188589?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-009", name: "Heavy Burger", category: "Burgers", price: 500, prepTimeMin: 9, calories: 890, description: "Loaded giant burger with twin crispy zinger fillets, fried egg, double cheese and house dressing.", image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-010", name: "Black Burger", category: "Burgers", price: 500, prepTimeMin: 8, calories: 620, description: "Charcoal black brioche bun with juicy grilled chicken patty, pepper jack and spicy smoky sauce.", image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80" },
    { sku: "BRG-011", name: "Pizza Burger", category: "Burgers", price: 450, prepTimeMin: 8, calories: 670, description: "Fusion burger overflowing with melted mozzarella cheese, pizza sauce, pepperoni & oregano.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80" },

    // ==========================================
    // SHAWARMA & HOT PARATHA ROLLS
    // ==========================================
    { sku: "SHA-001", name: "Plater Shawarma", category: "Shawarma & Rolls", price: 410, prepTimeMin: 7, calories: 590, description: "Deluxe open platter with carved rotisserie chicken, tahini, pickled cucumber, salad & pita bread.", image: "https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=600&auto=format&fit=crop&q=80" },
    { sku: "SHA-002", name: "Zinger Shawarma", category: "Shawarma & Rolls", price: 300, prepTimeMin: 5, calories: 490, description: "Crispy fried zinger strips wrapped in soft pita bread with garlic mayo and shredded cabbage.", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80" },
    {
      sku: "SHA-003",
      name: "Chicken Shawarma",
      category: "Shawarma & Rolls",
      price: 130,
      sizes: JSON.stringify([
        { name: "Small", price: 130 },
        { name: "Large", price: 160 },
      ]),
      prepTimeMin: 4,
      calories: 320,
      description: "Spiced rotisserie shredded chicken wrapped in warm pita with garlic mayo sauce.",
      image: "https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "SHA-004",
      name: "B.B.Q Shawarma",
      category: "Shawarma & Rolls",
      price: 250,
      sizes: JSON.stringify([
        { name: "Small", price: 250 },
        { name: "Large", price: 300 },
      ]),
      prepTimeMin: 5,
      calories: 360,
      description: "Smoky charcoal BBQ chicken shreds wrapped in fresh pita with BBQ glaze & onions.",
      image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80",
    },
    { sku: "ROL-001", name: "Chicken Paratha", category: "Shawarma & Rolls", price: 300, prepTimeMin: 6, calories: 520, description: "Crispy golden flaky paratha rolled with spiced chicken boti chunks and mint yogurt dip.", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80" },
    { sku: "ROL-002", name: "Zinger Paratha", category: "Shawarma & Rolls", price: 350, prepTimeMin: 6, calories: 580, description: "Crispy fried zinger fillet rolled in warm flaky lachha paratha with signature garlic mayo.", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80" },
    { sku: "ROL-003", name: "Chicken Kabab Paratha", category: "Shawarma & Rolls", price: 300, prepTimeMin: 6, calories: 490, description: "Grilled juicy chicken seekh kabab rolled in crispy paratha with sliced red onions.", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80" },
    { sku: "ROL-004", name: "Bihari Paratha", category: "Shawarma & Rolls", price: 250, prepTimeMin: 5, calories: 460, description: "Tender aromatic Bihari spiced chicken wrapped in freshly griddled paratha.", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80" },
    { sku: "ROL-005", name: "Pizza Paratha", category: "Shawarma & Rolls", price: 500, prepTimeMin: 8, calories: 680, description: "Crispy layered paratha stuffed with mozzarella, chicken tikka chunks, pizza sauce and olives.", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80" },
    { sku: "ROL-006", name: "Achari Paratha", category: "Shawarma & Rolls", price: 250, prepTimeMin: 5, calories: 440, description: "Tangy pickled-spice marinated chicken rolled in warm flaky paratha.", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80" },

    // ==========================================
    // SANDWICHES
    // ==========================================
    { sku: "SND-001", name: "Chicken Sandwich", category: "Sandwiches", price: 500, prepTimeMin: 7, calories: 550, description: "Club sandwich with shredded roasted chicken, fried egg, cheese, lettuce and herb mayo.", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80" },
    { sku: "SND-002", name: "Chicken Bihari Sandwich", category: "Sandwiches", price: 280, prepTimeMin: 6, calories: 420, description: "Grilled sandwich bread stuffed with juicy Bihari spiced chicken and fresh cucumber.", image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&auto=format&fit=crop&q=80" },

    // ==========================================
    // FRIED CHICKEN & WINGS
    // ==========================================
    {
      sku: "FRC-001",
      name: "Hot Wings",
      category: "Fried Chicken",
      price: 250,
      sizes: JSON.stringify([
        { name: "5 Pcs", price: 250 },
        { name: "10 Pcs", price: 500 },
      ]),
      prepTimeMin: 7,
      calories: 360,
      description: "Crispy golden chicken wings coated in hot spiced crumb.",
      image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "FRC-002",
      name: "OBB Wings",
      category: "Fried Chicken",
      price: 250,
      sizes: JSON.stringify([
        { name: "5 Pcs", price: 250 },
        { name: "10 Pcs", price: 450 },
      ]),
      prepTimeMin: 7,
      calories: 340,
      description: "Original Battered Boneless Wings with dipping sauce.",
      image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "FRC-003",
      name: "Nuggets",
      category: "Fried Chicken",
      price: 180,
      sizes: JSON.stringify([
        { name: "5 Pcs", price: 180 },
        { name: "10 Pcs", price: 350 },
      ]),
      prepTimeMin: 5,
      calories: 250,
      description: "Tender bite-sized breaded chicken nuggets with tomato dip.",
      image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80",
    },
    { sku: "FRC-004", name: "Leg Fried Chicken", category: "Fried Chicken", price: 350, prepTimeMin: 8, calories: 420, description: "Crispy pressure-fried whole chicken drumstick seasoned with secret herbs & spices.", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80" },
    { sku: "FRC-005", name: "Chest Fried Chicken", category: "Fried Chicken", price: 350, prepTimeMin: 9, calories: 460, description: "Crispy pressure-fried whole chicken breast piece with juicy meat & crunchy coating.", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80" },

    // ==========================================
    // FRIES & SIDES
    // ==========================================
    { sku: "FRS-001", name: "Pizza Fries", category: "Fries & Sides", price: 500, prepTimeMin: 8, calories: 620, description: "Golden fries baked with pizza sauce, mozzarella cheese, chicken chunks, olives & herbs.", image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80" },
    { sku: "FRS-002", name: "Loaded Fries", category: "Fries & Sides", price: 550, prepTimeMin: 8, calories: 680, description: "Crispy french fries drenched in cheddar cheese sauce, fried zinger bits & jalapenos.", image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80" },
    {
      sku: "FRS-003",
      name: "Simple Fries",
      category: "Fries & Sides",
      price: 150,
      sizes: JSON.stringify([
        { name: "Small", price: 150 },
        { name: "Large", price: 280 },
      ]),
      prepTimeMin: 4,
      calories: 240,
      description: "Crispy golden salted potato french fries.",
      image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    },
    { sku: "SDE-001", name: "Chicken Samosa", category: "Fries & Sides", price: 120, prepTimeMin: 4, calories: 220, description: "Crispy triangular pastries stuffed with spicy minced chicken & onions.", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80" },
    { sku: "SDE-002", name: "Chicken Pakora", category: "Fries & Sides", price: 300, prepTimeMin: 6, calories: 410, description: "Spiced gram flour batter-coated boneless chicken bites fried crisp.", image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80" },
    { sku: "SDE-003", name: "Simple Samosa", category: "Fries & Sides", price: 60, prepTimeMin: 3, calories: 180, description: "Crispy potato and peas samosa with cumin seeds and mint chutney.", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80" },
    { sku: "SDE-004", name: "Simple Pakora", category: "Fries & Sides", price: 150, prepTimeMin: 5, calories: 310, description: "Hot crisp gram-flour fritters with potatoes, onions, green chili and spinach.", image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80" },

    // ==========================================
    // PASTA FLAVOR
    // ==========================================
    {
      sku: "PST-001",
      name: "Special Pasta",
      category: "Pasta",
      price: 350,
      sizes: JSON.stringify([
        { name: "Small", price: 350 },
        { name: "Large", price: 600 },
      ]),
      prepTimeMin: 8,
      calories: 420,
      description: "House special penne pasta tossed with seasoned chicken, cream sauce & mushrooms.",
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PST-002",
      name: "Hot & Spicy Pasta",
      category: "Pasta",
      price: 330,
      sizes: JSON.stringify([
        { name: "Small", price: 330 },
        { name: "Large", price: 550 },
      ]),
      prepTimeMin: 8,
      calories: 390,
      description: "Fiery red chili pasta with chicken chunks, black olives and crushed red peppers.",
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PST-003",
      name: "Flaming Pasta",
      category: "Pasta",
      price: 330,
      sizes: JSON.stringify([
        { name: "Small", price: 330 },
        { name: "Large", price: 550 },
      ]),
      prepTimeMin: 8,
      calories: 410,
      description: "Smoky spicy pasta baked with jalapenos, spicy chicken and pepper sauce.",
      image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&auto=format&fit=crop&q=80",
    },
    {
      sku: "PST-004",
      name: "Microni & Vegi Pasta",
      category: "Pasta",
      price: 300,
      sizes: JSON.stringify([
        { name: "Small", price: 300 },
        { name: "Large", price: 500 },
      ]),
      prepTimeMin: 7,
      calories: 340,
      description: "Tender macaroni with fresh garden vegetables, sweet corn and herb butter.",
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80",
    },

    // ==========================================
    // SANAM ICE CREAM & BEVERAGES
    // ==========================================
    { sku: "ICE-001", name: "Sanam Special Kulfa Ice Cream", category: "Ice Cream & Drinks", price: 150, prepTimeMin: 2, calories: 220, description: "Authentic Khichiwala pure milk creamy kulfa topped with crushed pistachios & almonds.", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80" },
    { sku: "ICE-002", name: "Sanam Crunch Ice Cream", category: "Ice Cream & Drinks", price: 180, prepTimeMin: 2, calories: 260, description: "Rich butterscotch vanilla ice cream loaded with crispy caramelized praline crunch.", image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80" },
    { sku: "ICE-003", name: "Sanam Tutti Frutti Ice Cream", category: "Ice Cream & Drinks", price: 160, prepTimeMin: 2, calories: 210, description: "Colorful fruit-flavored creamy scoops studded with chewy candied fruit pieces.", image: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=600&auto=format&fit=crop&q=80" },
    { sku: "ICE-004", name: "Sanam Mango Ice Cream", category: "Ice Cream & Drinks", price: 150, prepTimeMin: 2, calories: 210, description: "Crafted with sweet Pakistani Chaunsa mango pulp and real dairy cream.", image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&auto=format&fit=crop&q=80" },
    { sku: "ICE-005", name: "Sanam Chocolate Ice Cream", category: "Ice Cream & Drinks", price: 180, prepTimeMin: 2, calories: 280, description: "Dark Dutch chocolate ice cream with melted chocolate fudge swirl.", image: "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=600&auto=format&fit=crop&q=80" },
    { sku: "ICE-006", name: "Sanam Vanilla Classic Ice Cream", category: "Ice Cream & Drinks", price: 130, prepTimeMin: 2, calories: 190, description: "Smooth aromatic classic vanilla bean ice cream scoop.", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80" },
    { sku: "ICE-007", name: "Sanam Royal Special Falooda", category: "Ice Cream & Drinks", price: 350, prepTimeMin: 5, calories: 450, description: "Traditional royal dessert with kulfa ice cream, basil seeds, vermicelli, rabri milk, rooh afza & nuts.", image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80" },
    { sku: "BEV-001", name: "Soft Drink (500 ml)", category: "Ice Cream & Drinks", price: 100, prepTimeMin: 1, calories: 180, description: "Chilled 500 ml bottle (Coca-Cola, Sprite, or Fanta).", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80" },
    { sku: "BEV-002", name: "Soft Drink (1 Ltr)", category: "Ice Cream & Drinks", price: 160, prepTimeMin: 1, calories: 360, description: "Chilled 1 Liter bottle (Coca-Cola, Sprite, or Fanta).", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80" },
    { sku: "BEV-003", name: "Soft Drink (1.5 Ltr)", category: "Ice Cream & Drinks", price: 220, prepTimeMin: 1, calories: 540, description: "Chilled 1.5 Liter party bottle (Coca-Cola, Sprite, or Fanta).", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80" },
    { sku: "BEV-004", name: "Soft Drink (2.25 Ltr)", category: "Ice Cream & Drinks", price: 280, prepTimeMin: 1, calories: 780, description: "Family jumbo 2.25 Liter bottle (Coca-Cola, Sprite, or Fanta).", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80" },
    { sku: "BEV-005", name: "Mineral Water (500 ml)", category: "Ice Cream & Drinks", price: 70, prepTimeMin: 1, calories: 0, description: "Pure chilled natural mineral water bottle.", image: "https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&auto=format&fit=crop&q=80" },
  ];

  const menuItemMap = new Map<string, any>();
  for (const item of menuItemsData) {
    const created = await prisma.menuItem.create({
      data: {
        sku: item.sku,
        name: item.name,
        category: item.category,
        price: item.price,
        sizes: item.sizes || null,
        prepTimeMin: item.prepTimeMin,
        calories: item.calories,
        description: item.description,
        image: item.image,
      },
    });
    menuItemMap.set(item.sku, created);
  }

  // 4. Modifiers (Extra Topping, Cheese, Dips)
  const cheeseIng = ingredientMap.get("Mozzarella & Cheddar Pizza Cheese Blend");
  const allItems = Array.from(menuItemMap.values());
  for (const item of allItems) {
    if (item.category === "Pizzas") {
      await prisma.modifier.createMany({
        data: [
          { name: "Extra Topping (Small)", price: 100, menuItemId: item.id, ingredientId: cheeseIng?.id },
          { name: "Extra Topping (Medium)", price: 200, menuItemId: item.id, ingredientId: cheeseIng?.id },
          { name: "Extra Topping (Large)", price: 250, menuItemId: item.id, ingredientId: cheeseIng?.id },
          { name: "Extra Topping (X-Large)", price: 350, menuItemId: item.id, ingredientId: cheeseIng?.id },
          { name: "Extra Cheese Burst", price: 150, menuItemId: item.id, ingredientId: cheeseIng?.id },
          { name: "Mayo Garlic Dip", price: 40, menuItemId: item.id },
          { name: "Hot & Spicy Dip", price: 40, menuItemId: item.id },
        ],
      });
    } else if (item.category === "Burgers") {
      await prisma.modifier.createMany({
        data: [
          { name: "Extra Cheese Slice", price: 50, menuItemId: item.id },
          { name: "Extra Mayo Garlic Sauce", price: 40, menuItemId: item.id },
          { name: "Extra Jalapenos", price: 40, menuItemId: item.id },
        ],
      });
    } else if (item.category === "Shawarma & Rolls") {
      await prisma.modifier.createMany({
        data: [
          { name: "Extra Cheese", price: 60, menuItemId: item.id },
          { name: "Extra Garlic Tahini Dip", price: 40, menuItemId: item.id },
        ],
      });
    }
  }

  // 5. Recipe items for BOM
  const zingerItem = menuItemMap.get("BRG-001");
  const zingerFillet = ingredientMap.get("Crispy Zinger Chicken Fillet");
  const burgerBun = ingredientMap.get("Burger Buns Sesame");
  if (zingerItem && zingerFillet && burgerBun) {
    await prisma.recipeItem.createMany({
      data: [
        { menuItemId: zingerItem.id, ingredientId: zingerFillet.id, quantityRequired: 1 },
        { menuItemId: zingerItem.id, ingredientId: burgerBun.id, quantityRequired: 1 },
      ],
    });
  }

  // 6. Active Sample Orders
  const now = new Date();

  // Order #101: PENDING (Fast & Free Home Delivery to Khichiwala)
  await prisma.order.create({
    data: {
      orderNumber: 101,
      orderType: "DELIVERY",
      status: "PENDING",
      subtotal: 1050,
      tax: 84,
      discount: 0,
      serviceCharge: 0,
      totalAmount: 1134,
      paymentMethod: "CASH",
      paymentStatus: "PENDING",
      customerName: "Chaudhry Waqas",
      customerPhone: "0301-4694202",
      deliveryAddress: "Near City Grid Station, Highway Road, Khichiwala",
      notes: "Free Home Delivery - Call before reaching",
      createdAt: new Date(now.getTime() - 4 * 60 * 1000),
      employeeId: empCashier.id,
      items: {
        create: [
          {
            menuItemId: menuItemMap.get("PIZ-001").id, // P.W. Special Pizza
            size: "Medium",
            quantity: 1,
            unitPrice: 1050,
          },
        ],
      },
    },
  });

  // Order #102: PREPARING (Dine-in family table)
  await prisma.order.create({
    data: {
      orderNumber: 102,
      orderType: "DINE_IN",
      status: "PREPARING",
      subtotal: 1600,
      tax: 128,
      discount: 100,
      serviceCharge: 0,
      totalAmount: 1628,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      customerName: "Family Table 4 (Haji Aslam)",
      customerPhone: "0346-8036202",
      prepStartTime: new Date(now.getTime() - 8 * 60 * 1000),
      createdAt: new Date(now.getTime() - 10 * 60 * 1000),
      employeeId: empCashier.id,
      items: {
        create: [
          {
            menuItemId: menuItemMap.get("DEA-004").id, // Deal 4
            quantity: 1,
            unitPrice: 1600,
          },
        ],
      },
    },
  });

  // Order #103: READY (Takeaway counter pickup)
  await prisma.order.create({
    data: {
      orderNumber: 103,
      orderType: "TAKEAWAY",
      status: "READY",
      subtotal: 950,
      tax: 76,
      discount: 0,
      serviceCharge: 0,
      totalAmount: 1026,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      customerName: "Rana Imran",
      customerPhone: "0300-7891234",
      prepStartTime: new Date(now.getTime() - 14 * 60 * 1000),
      readyTime: new Date(now.getTime() - 2 * 60 * 1000),
      createdAt: new Date(now.getTime() - 16 * 60 * 1000),
      employeeId: empCashier.id,
      items: {
        create: [
          {
            menuItemId: menuItemMap.get("DEA-001").id, // Deal 1
            quantity: 1,
            unitPrice: 650,
          },
          {
            menuItemId: menuItemMap.get("ROL-001").id, // Chicken Paratha
            quantity: 1,
            unitPrice: 300,
          },
        ],
      },
    },
  });

  // 7. Purchase Order
  const cheeseProd = ingredientMap.get("Mozzarella & Cheddar Pizza Cheese Blend");
  const wingsIng = ingredientMap.get("Chicken Drumsticks & Wings");
  if (cheeseProd && wingsIng) {
    await prisma.purchaseOrder.create({
      data: {
        poNumber: "PO-2026-PW002",
        supplier: "Dairy King & Fresh Poultry Khichiwala",
        totalCost: 22000.0,
        status: "PENDING",
        notes: "Replenishment of mozzarella cheese and fresh chicken wings",
        items: {
          create: [
            { ingredientId: cheeseProd.id, quantity: 8000, unitCost: 2.2 },
            { ingredientId: wingsIng.id, quantity: 100, unitCost: 45.0 },
          ],
        },
      },
    });
  }

  console.log("Database seeded successfully with clean variant-based pizzas and size options!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

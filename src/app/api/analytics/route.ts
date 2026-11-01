import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClosedMonth, getAllClosedMonths } from "@/lib/monthlyClose";

export const dynamic = "force-dynamic";

function getMonthLabel(monthKey: string): string {
  try {
    const cleanKey = monthKey.replace("-ARCHIVE", "");
    const [year, month] = cleanKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return monthKey;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const selectedMonth = searchParams.get("month") || currentMonthKey;

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Fetch all active orders (excluding CANCELLED and ARCHIVED)
    const allOrders = await prisma.order.findMany({
      where: {
        status: { notIn: ["CANCELLED", "ARCHIVED"] },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if selectedMonth is marked as reset / closed
    const cleanMonthKey = selectedMonth.replace("-ARCHIVE", "");
    const closedRecord = getClosedMonth(cleanMonthKey);
    const isMonthReset = Boolean(closedRecord?.isReset);
    const closedAtTime = closedRecord ? new Date(closedRecord.closedAt).getTime() : 0;

    // Filter today's orders (must be >= start of today AND after reset timestamp if reset)
    const todayOrders = allOrders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      const isToday = t >= startOfToday.getTime();
      const isAfterReset = !isMonthReset || t > closedAtTime;
      return isToday && isAfterReset;
    });

    const dailySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const todayOrdersCount = todayOrders.length;

    // Filter orders for the selected month
    let monthOrders: typeof allOrders = [];
    if (selectedMonth === "ALL") {
      monthOrders = allOrders;
    } else {
      const [y, m] = cleanMonthKey.split("-").map(Number);
      const startOfMonth = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

      monthOrders = allOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        const isInMonth = orderDate >= startOfMonth && orderDate <= endOfMonth;
        const isAfterReset = !isMonthReset || orderDate.getTime() > closedAtTime;
        return isInMonth && isAfterReset;
      });
    }

    // Month's active sales and orders
    const monthSales = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const monthOrdersCount = monthOrders.length;

    // All-time totals from active orders
    const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrdersCount = allOrders.length;
    const avgTicketValue =
      totalOrdersCount > 0 ? Math.round((totalRevenue / totalOrdersCount) * 100) / 100 : 0;

    // 2. Fetch supplies cost for this month from DailySupply (only non-archived)
    const suppliesWhere: any = { isArchived: false };
    if (selectedMonth !== "ALL") {
      suppliesWhere.monthKey = cleanMonthKey;
    }
    const activeSupplies = await prisma.dailySupply.findMany({
      where: suppliesWhere,
    });

    let monthSuppliesCost = 0;
    let monthSuppliesPaid = 0;
    let monthSuppliesPending = 0;

    // If month is reset, active supplies count from zero unless newly added
    if (!isMonthReset) {
      activeSupplies.forEach((s) => {
        monthSuppliesCost += s.totalCost;
        if (s.paymentStatus === "PAID") {
          monthSuppliesPaid += s.totalCost;
        } else {
          monthSuppliesPending += s.totalCost;
        }
      });
    } else {
      // For a reset month, only count supplies created after the reset timestamp
      activeSupplies.forEach((s) => {
        const supplyTime = new Date(s.createdAt).getTime();
        if (supplyTime > closedAtTime) {
          monthSuppliesCost += s.totalCost;
          if (s.paymentStatus === "PAID") {
            monthSuppliesPaid += s.totalCost;
          } else {
            monthSuppliesPending += s.totalCost;
          }
        }
      });
    }

    // 3. Active Orders Count in Kitchen/Billing (PENDING, PREPARING, READY)
    const activeOrdersCount = await prisma.order.count({
      where: {
        status: { in: ["PENDING", "PREPARING", "READY"] },
      },
    });

    // 4. Low stock items
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
    });
    const lowStockIngredients = ingredients.filter(
      (ing) => ing.currentStock <= ing.reorderThreshold
    );
    const lowStockItemsCount = lowStockIngredients.length;
    const lowStockItems = lowStockIngredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      currentStock: ing.currentStock,
      reorderThreshold: ing.reorderThreshold,
      supplier: ing.supplier || null,
      costPerUnit: ing.costPerUnit || 0,
      status: ing.currentStock <= 0 ? ("OUT_OF_STOCK" as const) : ("LOW" as const),
    }));

    // 5. Hourly Sales Breakdown
    const hourlyMap: { [hour: string]: { sales: number; orders: number } } = {};
    for (let h = 8; h <= 23; h++) {
      const label = `${String(h).padStart(2, "0")}:00`;
      hourlyMap[label] = { sales: 0, orders: 0 };
    }

    for (const order of todayOrders) {
      const orderDate = new Date(order.createdAt);
      const h = orderDate.getHours();
      const label = `${String(h).padStart(2, "0")}:00`;
      if (hourlyMap[label]) {
        hourlyMap[label].sales += order.totalAmount;
        hourlyMap[label].orders += 1;
      }
    }

    const hourlySales = Object.entries(hourlyMap).map(([hour, data]) => ({
      hour,
      sales: Math.round(data.sales * 100) / 100,
      orders: data.orders,
    }));

    // 6. Fast Food Items Sales Breakdown for Selected Month
    const relevantOrders = selectedMonth === "ALL" ? allOrders : monthOrders;
    const itemAggMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        quantity: number;
        revenue: number;
      }
    >();

    const categorySalesMap = new Map<string, { category: string; quantity: number; revenue: number }>();

    for (const ord of relevantOrders) {
      for (const oi of ord.items) {
        if (!oi.menuItem) continue;
        const itemId = oi.menuItem.id;
        const cat = oi.menuItem.category || "Fast Food";
        const lineRevenue = oi.quantity * oi.unitPrice;

        const prevItem = itemAggMap.get(itemId) || {
          id: itemId,
          name: oi.menuItem.name,
          category: cat,
          quantity: 0,
          revenue: 0,
        };
        prevItem.quantity += oi.quantity;
        prevItem.revenue = Math.round((prevItem.revenue + lineRevenue) * 100) / 100;
        itemAggMap.set(itemId, prevItem);

        const prevCat = categorySalesMap.get(cat) || {
          category: cat,
          quantity: 0,
          revenue: 0,
        };
        prevCat.quantity += oi.quantity;
        prevCat.revenue = Math.round((prevCat.revenue + lineRevenue) * 100) / 100;
        categorySalesMap.set(cat, prevCat);
      }
    }

    const fastFoodSales = Array.from(itemAggMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    const categorySales = Array.from(categorySalesMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    const topSellingItems = fastFoodSales.slice(0, 8);

    // 7. Dynamic Available Months
    const monthSet = new Set<string>();
    monthSet.add(currentMonthKey);

    allOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });

    const closedMonths = getAllClosedMonths();
    closedMonths.forEach((c) => monthSet.add(c.monthKey));

    const availableMonths = Array.from(monthSet)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const isClosed = Boolean(getClosedMonth(key));
        const ordersInMonth = allOrders.filter((o) => {
          const d = new Date(o.createdAt);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === key;
        });
        const salesInMonth = ordersInMonth.reduce((s, o) => s + o.totalAmount, 0);

        return {
          key,
          label: getMonthLabel(key) + (isClosed ? " (Fresh Cycle)" : ""),
          sales: salesInMonth,
          orders: ordersInMonth.length,
          isReset: isClosed,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        dailySales: Math.round(dailySales * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayOrdersCount,
        totalOrdersCount,
        avgTicketValue,
        activeOrdersCount,
        averagePrepTimeMinutes: 5.2,
        lowStockItemsCount,
        lowStockItems,
        hourlySales,
        topSellingItems,
        fastFoodSales,
        categorySales,
        wasteVsUsage: [],
        monthKey: selectedMonth,
        monthLabel: selectedMonth === "ALL" ? "All Time History" : getMonthLabel(selectedMonth),
        monthSales: Math.round(monthSales * 100) / 100,
        monthOrdersCount,
        monthSuppliesCost: Math.round(monthSuppliesCost * 100) / 100,
        monthSuppliesPaid: Math.round(monthSuppliesPaid * 100) / 100,
        monthSuppliesPending: Math.round(monthSuppliesPending * 100) / 100,
        netMonthlyProfit: Math.round((monthSales - monthSuppliesCost) * 100) / 100,
        isMonthReset,
        archivedSnapshot: closedRecord || null,
        availableMonths,
      },
    });
  } catch (error: any) {
    console.error("Failed to generate analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
}

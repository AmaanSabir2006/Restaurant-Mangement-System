import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // e.g. "2026-11-01"

    let targetDate: Date;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const [year, month, day] = dateParam.split("-").map(Number);
      targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const dateKey = targetDate.toISOString().slice(0, 10);
    const formattedDate = targetDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

    // 1. Fetch Orders for this Day
    const dayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
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

    let totalSales = 0;
    let cashSales = 0;
    let cardSales = 0;

    const itemsMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        quantitySold: number;
        unitPrice: number;
        totalRevenue: number;
      }
    >();

    dayOrders.forEach((ord) => {
      totalSales += ord.totalAmount;
      if (ord.paymentMethod === "CARD") {
        cardSales += ord.totalAmount;
      } else {
        cashSales += ord.totalAmount;
      }

      ord.items.forEach((it) => {
        const itemKey = it.menuItemId;
        const itemName = it.menuItem?.name || "Fast Food Item";
        const category = it.menuItem?.category || "Fast Food";
        const revenue = it.quantity * it.unitPrice;

        const existing = itemsMap.get(itemKey) || {
          id: itemKey,
          name: itemName,
          category,
          quantitySold: 0,
          unitPrice: it.unitPrice,
          totalRevenue: 0,
        };

        existing.quantitySold += it.quantity;
        existing.totalRevenue += revenue;
        itemsMap.set(itemKey, existing);
      });
    });

    const itemsSold = Array.from(itemsMap.values())
      .map((item) => ({
        ...item,
        percentageOfSales:
          totalSales > 0 ? Math.round((item.totalRevenue / totalSales) * 100) : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 2. Fetch Daily Supplies for this Day
    const daySupplies = await prisma.dailySupply.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isArchived: false,
      },
      orderBy: { date: "desc" },
    });

    let totalSuppliesCost = 0;
    let totalSuppliesPaid = 0;
    let totalSuppliesPending = 0;

    const vendorMap = new Map<
      string,
      {
        personName: string;
        itemsCount: number;
        totalSuppliesCost: number;
        paidAmount: number;
        pendingAmount: number;
      }
    >();

    daySupplies.forEach((s) => {
      totalSuppliesCost += s.totalCost;
      if (s.paymentStatus === "PAID") {
        totalSuppliesPaid += s.totalCost;
      } else {
        totalSuppliesPending += s.totalCost;
      }

      const pKey = s.personName.trim();
      const v = vendorMap.get(pKey) || {
        personName: pKey,
        itemsCount: 0,
        totalSuppliesCost: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };

      v.itemsCount += 1;
      v.totalSuppliesCost += s.totalCost;
      if (s.paymentStatus === "PAID") {
        v.paidAmount += s.totalCost;
      } else {
        v.pendingAmount += s.totalCost;
      }
      vendorMap.set(pKey, v);
    });

    // 3. Overall All-Time Pending Balance for each Vendor
    const allPendingSupplies = await prisma.dailySupply.findMany({
      where: {
        paymentStatus: "PENDING",
        isArchived: false,
      },
      select: {
        personName: true,
        totalCost: true,
      },
    });

    const overallPendingMap = new Map<string, number>();
    allPendingSupplies.forEach((s) => {
      const pKey = s.personName.trim();
      overallPendingMap.set(pKey, (overallPendingMap.get(pKey) || 0) + s.totalCost);
    });

    const vendorSettlementSummary = Array.from(vendorMap.values())
      .map((v) => ({
        ...v,
        overallPendingBalance: overallPendingMap.get(v.personName) || 0,
        status: (v.pendingAmount > 0 ? "PENDING" : "CLEARED") as "PENDING" | "CLEARED",
      }))
      .sort((a, b) => b.totalSuppliesCost - a.totalSuppliesCost);

    return NextResponse.json({
      success: true,
      date: dateKey,
      formattedDate,
      salesSummary: {
        totalRevenue: totalSales,
        ordersCount: dayOrders.length,
        cashSales,
        cardSales,
        itemsSold,
      },
      suppliesSummary: {
        totalCost: totalSuppliesCost,
        totalPaid: totalSuppliesPaid,
        totalPending: totalSuppliesPending,
        entriesCount: daySupplies.length,
        supplies: daySupplies,
      },
      vendorSettlementSummary,
      cashFlow: {
        totalSales,
        cashPaidOut: totalSuppliesPaid,
        netCashFlow: totalSales - totalSuppliesPaid,
        pendingUdhaarToday: totalSuppliesPending,
      },
    });
  } catch (error: any) {
    console.error("GET /api/daily-log error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load daily log" },
      { status: 500 }
    );
  }
}

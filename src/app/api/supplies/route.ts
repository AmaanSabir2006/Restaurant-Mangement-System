import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to format "2026-11" -> "November 2026"
function getMonthLabel(monthKey: string): string {
  try {
    const [year, month] = monthKey.split("-").map(Number);
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
    const paymentFilter = searchParams.get("status"); // ALL | PAID | PENDING
    const search = searchParams.get("search")?.toLowerCase().trim();
    const includeArchived = searchParams.get("includeArchived") === "true";

    // Build Prisma query condition
    const where: any = {};

    if (selectedMonth !== "ALL") {
      where.monthKey = selectedMonth;
    }

    if (!includeArchived) {
      where.isArchived = false;
    }

    if (paymentFilter && paymentFilter !== "ALL") {
      where.paymentStatus = paymentFilter;
    }

    // Fetch entries
    const allSupplies = await prisma.dailySupply.findMany({
      where,
      orderBy: { date: "desc" },
    });

    // Client-side search filtering if present
    const filteredSupplies = search
      ? allSupplies.filter(
          (s) =>
            s.personName.toLowerCase().includes(search) ||
            s.itemName.toLowerCase().includes(search) ||
            (s.notes && s.notes.toLowerCase().includes(search))
        )
      : allSupplies;

    // Fetch all distinct available months from DB to populate month selector
    const distinctMonthsData = await prisma.dailySupply.findMany({
      select: { monthKey: true, totalCost: true, isArchived: true },
    });

    const monthMap = new Map<string, { totalCost: number; count: number }>();
    // Ensure current month is always in available months
    monthMap.set(currentMonthKey, { totalCost: 0, count: 0 });

    distinctMonthsData.forEach((item) => {
      const existing = monthMap.get(item.monthKey) || { totalCost: 0, count: 0 };
      monthMap.set(item.monthKey, {
        totalCost: existing.totalCost + (item.isArchived ? 0 : item.totalCost),
        count: existing.count + 1,
      });
    });

    const availableMonths = Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // latest month first
      .map(([key, data]) => ({
        key,
        label: getMonthLabel(key),
        totalCost: data.totalCost,
        count: data.count,
      }));

    // Calculate Analytics for current filtered month
    let totalCost = 0;
    let totalPaid = 0;
    let totalPending = 0;

    const personMap = new Map<
      string,
      { totalCost: number; count: number; paidAmount: number; pendingAmount: number }
    >();

    const itemMap = new Map<
      string,
      { totalCost: number; totalQuantity: number; unit: string; count: number }
    >();

    filteredSupplies.forEach((s) => {
      totalCost += s.totalCost;
      if (s.paymentStatus === "PAID") {
        totalPaid += s.totalCost;
      } else {
        totalPending += s.totalCost;
      }

      // Group by Person
      const pKey = s.personName.trim();
      const pData = personMap.get(pKey) || {
        totalCost: 0,
        count: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };
      pData.totalCost += s.totalCost;
      pData.count += 1;
      if (s.paymentStatus === "PAID") {
        pData.paidAmount += s.totalCost;
      } else {
        pData.pendingAmount += s.totalCost;
      }
      personMap.set(pKey, pData);

      // Group by Item
      const iKey = s.itemName.trim();
      const iData = itemMap.get(iKey) || {
        totalCost: 0,
        totalQuantity: 0,
        unit: s.unit || "kg",
        count: 0,
      };
      iData.totalCost += s.totalCost;
      iData.totalQuantity += s.quantity || 1;
      iData.count += 1;
      itemMap.set(iKey, iData);
    });

    const byPerson = Array.from(personMap.entries())
      .map(([personName, data]) => ({
        personName,
        totalCost: data.totalCost,
        count: data.count,
        paidAmount: data.paidAmount,
        pendingAmount: data.pendingAmount,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    const byItem = Array.from(itemMap.entries())
      .map(([itemName, data]) => ({
        itemName,
        totalCost: data.totalCost,
        totalQuantity: data.totalQuantity,
        unit: data.unit,
        count: data.count,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    return NextResponse.json({
      success: true,
      monthKey: selectedMonth,
      monthLabel: selectedMonth === "ALL" ? "All Time Records" : getMonthLabel(selectedMonth),
      totalCost,
      totalPaid,
      totalPending,
      totalEntries: filteredSupplies.length,
      supplies: filteredSupplies,
      byPerson,
      byItem,
      availableMonths,
    });
  } catch (error: any) {
    console.error("GET /api/supplies error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch daily supplies" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      personName,
      itemName,
      quantity = 1,
      unit = "kg",
      totalCost,
      paymentStatus = "PAID",
      notes,
      date,
    } = body;

    if (!personName || !personName.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide the name of the person." },
        { status: 400 }
      );
    }

    if (!itemName || !itemName.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide the item bought (e.g. Onions, Potatoes, Chicken)." },
        { status: 400 }
      );
    }

    if (totalCost === undefined || totalCost === null || isNaN(Number(totalCost))) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid price/money given." },
        { status: 400 }
      );
    }

    const entryDate = date ? new Date(date) : new Date();
    const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;

    const supply = await prisma.dailySupply.create({
      data: {
        personName: personName.trim(),
        itemName: itemName.trim(),
        quantity: Number(quantity) > 0 ? Number(quantity) : 1,
        unit: (unit || "kg").trim(),
        totalCost: Number(totalCost),
        paymentStatus: paymentStatus === "PENDING" ? "PENDING" : "PAID",
        notes: notes ? notes.trim() : null,
        monthKey,
        isArchived: false,
        date: entryDate,
      },
    });

    return NextResponse.json({ success: true, supply }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/supplies error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create daily supply entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, paymentStatus, totalCost, personName, itemName, quantity, unit, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Supply ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (totalCost !== undefined) updateData.totalCost = Number(totalCost);
    if (personName) updateData.personName = personName.trim();
    if (itemName) updateData.itemName = itemName.trim();
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (unit) updateData.unit = unit.trim();
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.dailySupply.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, supply: updated });
  } catch (error: any) {
    console.error("PATCH /api/supplies error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update daily supply" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Supply ID is required for deletion" },
        { status: 400 }
      );
    }

    await prisma.dailySupply.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Entry deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/supplies error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete entry" },
      { status: 500 }
    );
  }
}

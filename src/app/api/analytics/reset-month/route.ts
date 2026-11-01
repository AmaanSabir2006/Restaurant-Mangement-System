import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetMonthSales, restoreMonthSales, getClosedMonth } from "@/lib/monthlyClose";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { monthKey, action = "reset", notes, resetSupplies = true } = body;

    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const targetMonthKey = (!monthKey || monthKey === "ALL") ? currentMonthKey : monthKey;

    const [year, month] = targetMonthKey.split("-").map(Number);
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    if (action === "reset" || action === "start_fresh") {
      // 1. Calculate the final snapshot of sales & orders for this month before resetting
      const monthOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { notIn: ["CANCELLED", "ARCHIVED"] },
        },
      });

      const totalSales = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalOrders = monthOrders.length;

      // Also get supplies total
      const suppliesAgg = await prisma.dailySupply.aggregate({
        where: { monthKey: targetMonthKey },
        _sum: { totalCost: true },
      });
      const totalSupplies = suppliesAgg._sum.totalCost || 0;

      // 2. Archive snapshot state for this month
      const record = resetMonthSales(targetMonthKey, {
        totalSales,
        totalOrders,
        totalSupplies,
        notes: notes || (action === "start_fresh" ? "Fresh start initialized" : `Month closed on ${new Date().toLocaleDateString("en-US")}`),
      });

      // 3. Mark orders as ARCHIVED so active sales and today's sales become 0
      if (action === "start_fresh") {
        // For fresh start, archive all existing non-cancelled orders across the system
        await prisma.order.updateMany({
          where: { status: { notIn: ["CANCELLED", "ARCHIVED"] } },
          data: { status: "ARCHIVED" },
        });
      } else {
        // Archive orders in this target month
        await prisma.order.updateMany({
          where: {
            createdAt: { gte: startOfMonth, lte: endOfMonth },
            status: { notIn: ["CANCELLED", "ARCHIVED"] },
          },
          data: { status: "ARCHIVED" },
        });
      }

      // 4. Archive supplies for this month
      if (resetSupplies) {
        if (action === "start_fresh") {
          await prisma.dailySupply.updateMany({
            where: { isArchived: false },
            data: { isArchived: true },
          });
        } else {
          await prisma.dailySupply.updateMany({
            where: { monthKey: targetMonthKey, isArchived: false },
            data: { isArchived: true },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: action === "start_fresh"
          ? "All counters have been reset to Rs. 0. You are ready to start completely fresh!"
          : `Monthly sales for ${targetMonthKey} have been closed & archived. Counter reset to Rs. 0.`,
        record,
      });
    } else if (action === "restore") {
      restoreMonthSales(targetMonthKey);

      // Restore orders from ARCHIVED to COMPLETED
      await prisma.order.updateMany({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: "ARCHIVED",
        },
        data: { status: "COMPLETED" },
      });

      // Also unarchive supplies if requested
      if (resetSupplies) {
        await prisma.dailySupply.updateMany({
          where: { monthKey: targetMonthKey, isArchived: true },
          data: { isArchived: false },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Monthly records for ${targetMonthKey} restored from archive.`,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/analytics/reset-month error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset month" },
      { status: 500 }
    );
  }
}

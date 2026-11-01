import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { monthKey, action = "reset" } = body;

    if (!monthKey) {
      return NextResponse.json(
        { success: false, error: "Month key (e.g. 2026-11) is required" },
        { status: 400 }
      );
    }

    if (action === "reset") {
      // Archive entries for this month so active running total starts fresh from 0
      const updated = await prisma.dailySupply.updateMany({
        where: { monthKey, isArchived: false },
        data: { isArchived: true },
      });

      return NextResponse.json({
        success: true,
        message: `Monthly total for ${monthKey} has been reset to Rs. 0. All records safely archived.`,
        archivedCount: updated.count,
      });
    } else if (action === "restore") {
      // Unarchive entries if user wants to restore the month
      const updated = await prisma.dailySupply.updateMany({
        where: { monthKey, isArchived: true },
        data: { isArchived: false },
      });

      return NextResponse.json({
        success: true,
        message: `Monthly records for ${monthKey} restored.`,
        restoredCount: updated.count,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/supplies/reset-month error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset month" },
      { status: 500 }
    );
  }
}

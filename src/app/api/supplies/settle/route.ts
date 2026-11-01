import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      supplyId,
      personName,
      paymentMethod = "CASH",
      settlementNotes,
    } = body;

    const todayStr = new Date().toISOString().slice(0, 10);
    const methodLabel =
      paymentMethod === "BANK_TRANSFER"
        ? "Bank Transfer"
        : paymentMethod === "EASYPAISA_JAZZCASH"
        ? "JazzCash / EasyPaisa"
        : "Cash";

    if (supplyId) {
      // Settle a specific pending supply
      const supply = await prisma.dailySupply.findUnique({
        where: { id: supplyId },
      });

      if (!supply) {
        return NextResponse.json(
          { success: false, error: "Supply entry not found" },
          { status: 404 }
        );
      }

      const noteSuffix = ` [Paid Rs. ${supply.totalCost} on ${todayStr} via ${methodLabel}${
        settlementNotes ? `: ${settlementNotes.trim()}` : ""
      }]`;

      const updated = await prisma.dailySupply.update({
        where: { id: supplyId },
        data: {
          paymentStatus: "PAID",
          notes: supply.notes ? `${supply.notes} |${noteSuffix}` : noteSuffix.trim(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Settled payment of Rs. ${supply.totalCost} to ${supply.personName}`,
        supply: updated,
      });
    } else if (personName) {
      // Settle all pending supplies for this person
      const pendingSupplies = await prisma.dailySupply.findMany({
        where: {
          personName: personName.trim(),
          paymentStatus: "PENDING",
        },
      });

      if (pendingSupplies.length === 0) {
        return NextResponse.json(
          { success: false, error: `No pending items found for ${personName}` },
          { status: 400 }
        );
      }

      let totalSettled = 0;
      for (const s of pendingSupplies) {
        totalSettled += s.totalCost;
        const noteSuffix = ` [Paid Rs. ${s.totalCost} on ${todayStr} via ${methodLabel}${
          settlementNotes ? `: ${settlementNotes.trim()}` : ""
        }]`;

        await prisma.dailySupply.update({
          where: { id: s.id },
          data: {
            paymentStatus: "PAID",
            notes: s.notes ? `${s.notes} |${noteSuffix}` : noteSuffix.trim(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Settled all pending balances (Rs. ${totalSettled}) for ${personName}`,
        settledAmount: totalSettled,
        count: pendingSupplies.length,
      });
    }

    return NextResponse.json(
      { success: false, error: "Please provide either supplyId or personName" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/supplies/settle error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to settle payment" },
      { status: 500 }
    );
  }
}

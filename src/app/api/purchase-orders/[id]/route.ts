import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastRealtimeEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !["RECEIVED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Valid status (RECEIVED or CANCELLED) is required" },
        { status: 400 }
      );
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!po) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }

    if (po.status === "RECEIVED") {
      return NextResponse.json(
        { success: false, error: "Purchase order is already received" },
        { status: 400 }
      );
    }

    const updatedPO = await prisma.$transaction(async (tx) => {
      // If marking as received, increment inventory stocks and create audit transactions
      if (status === "RECEIVED") {
        for (const item of po.items) {
          await tx.ingredient.update({
            where: { id: item.ingredientId },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          });

          await tx.stockTransaction.create({
            data: {
              ingredientId: item.ingredientId,
              type: "RESTOCK",
              quantity: item.quantity,
              reason: `PO restock arrival: ${po.poNumber} (${po.supplier})`,
              referenceId: po.id,
            },
          });
        }
      }

      return await tx.purchaseOrder.update({
        where: { id },
        data: {
          status,
          receivedAt: status === "RECEIVED" ? new Date() : null,
        },
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    });

    broadcastRealtimeEvent("PO_UPDATED", updatedPO);
    if (status === "RECEIVED") {
      broadcastRealtimeEvent("STOCK_UPDATED", { poId: id });
    }

    return NextResponse.json({ success: true, purchaseOrder: updatedPO });
  } catch (error: any) {
    console.error("Failed to update purchase order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update purchase order: " + error.message },
      { status: 500 }
    );
  }
}

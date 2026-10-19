import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPurchaseOrderSchema } from "@/lib/validation";
import { broadcastRealtimeEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, purchaseOrders });
  } catch (error: any) {
    console.error("Failed to fetch purchase orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = createPurchaseOrderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { supplier, notes, items } = parseResult.data;

    const poCount = await prisma.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, "0")}`;

    const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const createdPO = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplier,
        notes: notes || null,
        totalCost: Math.round(totalCost * 100) / 100,
        status: "PENDING",
        items: {
          create: items.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        },
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    broadcastRealtimeEvent("PO_UPDATED", createdPO);

    return NextResponse.json({ success: true, purchaseOrder: createdPO }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create purchase order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create purchase order: " + error.message },
      { status: 500 }
    );
  }
}

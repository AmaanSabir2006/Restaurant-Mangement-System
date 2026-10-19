import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusSchema } from "@/lib/validation";
import { broadcastRealtimeEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        employee: true,
        items: {
          include: {
            menuItem: {
              include: {
                recipeItems: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
            modifiers: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const parseResult = updateOrderStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { status: targetStatus } = parseResult.data;

    // Fetch existing order with items and recipe details
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                recipeItems: true,
              },
            },
            modifiers: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const now = new Date();
    const timestampsToUpdate: any = {};

    if (targetStatus === "PREPARING" && !existingOrder.prepStartTime) {
      timestampsToUpdate.prepStartTime = now;
    } else if (targetStatus === "READY") {
      timestampsToUpdate.readyTime = now;
    } else if (targetStatus === "COMPLETED") {
      timestampsToUpdate.completedTime = now;
    }

    // Determine if inventory needs deduction:
    // Deduct when moving from PENDING to PREPARING (or directly to COMPLETED / READY)
    const shouldDeductInventory =
      existingOrder.status === "PENDING" &&
      (targetStatus === "PREPARING" || targetStatus === "READY" || targetStatus === "COMPLETED");

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order status and timestamps
      const order = await tx.order.update({
        where: { id },
        data: {
          status: targetStatus,
          ...timestampsToUpdate,
        },
        include: {
          employee: true,
          items: {
            include: {
              menuItem: true,
              modifiers: true,
            },
          },
        },
      });

      // 2. Perform Recipe BOM Inventory Deductions
      if (shouldDeductInventory) {
        // Collect all ingredient deductions
        const ingredientDeductions = new Map<string, { qty: number; reason: string }>();

        for (const item of existingOrder.items) {
          // A. Recipe BOM for the menu item
          if (item.menuItem?.recipeItems) {
            for (const recipe of item.menuItem.recipeItems) {
              const totalRequired = recipe.quantityRequired * item.quantity;
              const prev = ingredientDeductions.get(recipe.ingredientId) || {
                qty: 0,
                reason: `Order #${existingOrder.orderNumber} prep`,
              };
              ingredientDeductions.set(recipe.ingredientId, {
                qty: prev.qty + totalRequired,
                reason: prev.reason,
              });
            }
          }

          // B. Modifiers that consume ingredients (e.g., extra cheese, bacon)
          if (item.modifiers && item.modifiers.length > 0) {
            for (const mod of item.modifiers) {
              if (mod.modifierId) {
                const dbMod = await tx.modifier.findUnique({
                  where: { id: mod.modifierId },
                });
                if (dbMod && dbMod.ingredientId && dbMod.extraQty) {
                  const modRequired = dbMod.extraQty * item.quantity;
                  const prev = ingredientDeductions.get(dbMod.ingredientId) || {
                    qty: 0,
                    reason: `Order #${existingOrder.orderNumber} modifier add-on`,
                  };
                  ingredientDeductions.set(dbMod.ingredientId, {
                    qty: prev.qty + modRequired,
                    reason: prev.reason,
                  });
                }
              }
            }
          }
        }

        // Apply deductions to Ingredient currentStock and record StockTransactions
        for (const [ingredientId, deduction] of ingredientDeductions.entries()) {
          await tx.ingredient.update({
            where: { id: ingredientId },
            data: {
              currentStock: {
                decrement: deduction.qty,
              },
            },
          });

          await tx.stockTransaction.create({
            data: {
              ingredientId,
              type: "USAGE",
              quantity: -deduction.qty,
              reason: deduction.reason,
              referenceId: existingOrder.id,
            },
          });
        }
      }

      return order;
    });

    // Broadcast realtime notifications
    broadcastRealtimeEvent("ORDER_STATUS_CHANGED", updatedOrder);
    if (shouldDeductInventory) {
      broadcastRealtimeEvent("STOCK_UPDATED", { orderId: updatedOrder.id });
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order status: " + error.message },
      { status: 500 }
    );
  }
}

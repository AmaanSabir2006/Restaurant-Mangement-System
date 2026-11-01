import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validation";
import { broadcastRealtimeEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const active = searchParams.get("active"); // "true" for KDS
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};

    if (active === "true") {
      where.status = {
        in: ["PENDING", "PREPARING", "READY"],
      };
    } else if (status) {
      where.status = status;
    } else {
      where.status = { notIn: ["ARCHIVED", "CANCELLED"] };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        employee: true,
        items: {
          include: {
            menuItem: true,
            modifiers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = createOrderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Fetch menu items and modifiers from DB for authoritative pricing
    const menuItemIds = input.items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });
    const menuItemMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    // All modifier IDs across items
    const allModifierIds = input.items.flatMap((i) => i.modifierIds || []);
    const dbModifiers = allModifierIds.length > 0
      ? await prisma.modifier.findMany({ where: { id: { in: allModifierIds } } })
      : [];
    const modifierMap = new Map(dbModifiers.map((m) => [m.id, m]));

    // Compute subtotal
    let subtotal = 0;
    interface PreparedItem {
      menuItemId: string;
      quantity: number;
      size: string | null;
      unitPrice: number;
      notes: string | null;
      modifiers: {
        modifierId: string;
        name: string;
        price: number;
      }[];
    }
    const itemsToCreate: PreparedItem[] = [];

    for (const item of input.items) {
      const dbItem = menuItemMap.get(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { success: false, error: `Menu item not found: ${item.menuItemId}` },
          { status: 400 }
        );
      }

      let itemUnitPrice = dbItem.price;
      if (item.size && dbItem.sizes) {
        try {
          const parsedSizes = JSON.parse(dbItem.sizes);
          const matchedSize = parsedSizes.find((s: any) => s.name.toLowerCase() === item.size?.toLowerCase());
          if (matchedSize) {
            itemUnitPrice = matchedSize.price;
          } else if (typeof item.unitPrice === "number" && item.unitPrice > 0) {
            itemUnitPrice = item.unitPrice;
          }
        } catch {
          if (typeof item.unitPrice === "number" && item.unitPrice > 0) {
            itemUnitPrice = item.unitPrice;
          }
        }
      } else if (typeof item.unitPrice === "number" && item.unitPrice > 0) {
        itemUnitPrice = item.unitPrice;
      }

      const appliedModifiers: { modifierId: string; name: string; price: number }[] = [];

      if (item.modifierIds && item.modifierIds.length > 0) {
        for (const modId of item.modifierIds) {
          const dbMod = modifierMap.get(modId);
          if (dbMod) {
            itemUnitPrice += dbMod.price;
            appliedModifiers.push({
              modifierId: dbMod.id,
              name: dbMod.name,
              price: dbMod.price,
            });
          }
        }
      }

      const itemTotal = itemUnitPrice * item.quantity;
      subtotal += itemTotal;

      itemsToCreate.push({
        menuItemId: dbItem.id,
        quantity: item.quantity,
        size: item.size || null,
        unitPrice: itemUnitPrice,
        notes: item.notes || null,
        modifiers: appliedModifiers,
      });
    }

    // Sales tax removed (0%)
    const tax = 0;
    const discount = Math.min(subtotal, Math.round((input.discount || 0) * 100) / 100);
    const serviceCharge = Math.round((input.serviceCharge || 0) * 100) / 100;
    const totalAmount = Math.max(0, Math.round((subtotal + tax + serviceCharge - discount) * 100) / 100);

    // Get next order number
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const nextOrderNumber = (lastOrder?.orderNumber || 100) + 1;

    // Create order transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: nextOrderNumber,
          orderType: input.orderType,
          status: "PENDING",
          subtotal,
          tax,
          discount,
          serviceCharge,
          totalAmount,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentStatus || "PAID",
          customerName: input.customerName || null,
          customerPhone: input.customerPhone || null,
          deliveryAddress: input.deliveryAddress || null,
          notes: input.notes || null,
          employeeId: input.employeeId || null,
        },
      });

      for (const item of itemsToCreate) {
        const createdOrderItem = await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            size: item.size,
            unitPrice: item.unitPrice,
            notes: item.notes,
          },
        });

        if (item.modifiers.length > 0) {
          for (const mod of item.modifiers) {
            await tx.orderItemModifier.create({
              data: {
                orderItemId: createdOrderItem.id,
                modifierId: mod.modifierId,
                name: mod.name,
                price: mod.price,
              },
            });
          }
        }

        // Automatic Stock Maintenance & Deduction
        const dbItem = menuItemMap.get(item.menuItemId);
        if (dbItem) {
          const cat = dbItem.category?.toLowerCase() || "";
          const nameLower = dbItem.name.toLowerCase();
          const sizeLower = item.size?.toLowerCase() || "medium";
          const qty = item.quantity;

          // Helper to deduct ingredient
          const deductIngredient = async (searchPattern: string, amount: number) => {
            const ing = await tx.ingredient.findFirst({
              where: { name: { contains: searchPattern } },
            });
            if (ing) {
              await tx.ingredient.update({
                where: { id: ing.id },
                data: { currentStock: { decrement: amount } },
              });
              await tx.stockTransaction.create({
                data: {
                  ingredientId: ing.id,
                  type: "USAGE",
                  quantity: -amount,
                  referenceId: createdOrder.id,
                  reason: `Used for Order #${createdOrder.orderNumber}: ${item.quantity}x ${dbItem.name}${item.size ? ` (${item.size})` : ""}`,
                },
              });
            }
          };

          if (cat.includes("pizza")) {
            // Dough
            if (sizeLower.includes("small")) await deductIngredient("Dough Ball (Small)", 1 * qty);
            else if (sizeLower.includes("large") && !sizeLower.includes("x-large")) await deductIngredient("Dough Ball (Large)", 1 * qty);
            else if (sizeLower.includes("x-large")) await deductIngredient("Dough Ball (X-Large)", 1 * qty);
            else await deductIngredient("Dough Ball (Medium)", 1 * qty);

            // Cheese & Sauce
            const cheeseGrams = sizeLower.includes("small") ? 150 : sizeLower.includes("x-large") ? 450 : sizeLower.includes("large") ? 350 : 250;
            await deductIngredient("Cheese Blend", cheeseGrams * qty);
            await deductIngredient("Pizza Sauce", 50 * qty);
            await deductIngredient("Chicken", 120 * qty);
          } else if (cat.includes("burger")) {
            await deductIngredient("Burger Buns", 1 * qty);
            if (nameLower.includes("zinger")) await deductIngredient("Zinger Chicken", 1 * qty);
            else await deductIngredient("Chicken", 80 * qty);
          } else if (cat.includes("shawarma") || cat.includes("roll")) {
            if (nameLower.includes("paratha")) await deductIngredient("Paratha Dough", 1 * qty);
            else await deductIngredient("Pita Bread", 1 * qty);
            await deductIngredient("Chicken", 100 * qty);
          } else if (cat.includes("fries") || cat.includes("sides")) {
            await deductIngredient("French Fries", 200 * qty);
          } else if (cat.includes("fried chicken")) {
            const wingsCount = nameLower.includes("10") ? 10 : 5;
            await deductIngredient("Wings", wingsCount * qty);
          } else if (cat.includes("drink")) {
            await deductIngredient("Drink Bottles", 1 * qty);
          }
        }
      }

      return await tx.order.findUnique({
        where: { id: createdOrder.id },
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
    });

    // Broadcast real-time event for KDS & dashboards
    broadcastRealtimeEvent("ORDER_CREATED", newOrder);
    broadcastRealtimeEvent("STOCK_UPDATED", {});

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order: " + error.message },
      { status: 500 }
    );
  }
}

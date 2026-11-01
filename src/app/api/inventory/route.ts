import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stockAdjustmentSchema } from "@/lib/validation";
import { broadcastRealtimeEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      include: {
        recipeItems: {
          include: {
            menuItem: true,
          },
        },
        stockTransactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
      orderBy: { name: "asc" },
    });

    const recentTransactions = await prisma.stockTransaction.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        ingredient: true,
      },
    });

    // Enrich ingredients with usage, restock totals, and supplier info
    const enrichedIngredients = ingredients.map((ing) => {
      let status: "NORMAL" | "LOW" | "OUT_OF_STOCK" = "NORMAL";
      if (ing.currentStock <= 0) {
        status = "OUT_OF_STOCK";
      } else if (ing.currentStock <= ing.reorderThreshold) {
        status = "LOW";
      }

      // Calculate total used and total restocked
      let totalUsed = 0;
      let totalRestocked = 0;
      let lastSupplier = ing.supplier;
      let lastRestockedAt: Date | null = null;

      for (const tx of ing.stockTransactions) {
        if (tx.type === "USAGE" || tx.type === "WASTE") {
          totalUsed += Math.abs(tx.quantity);
        } else if (tx.type === "RESTOCK") {
          totalRestocked += Math.abs(tx.quantity);
          if (!lastRestockedAt) {
            lastRestockedAt = tx.createdAt;
            if (tx.supplier) lastSupplier = tx.supplier;
          }
        }
      }

      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        currentStock: Math.round(ing.currentStock * 100) / 100,
        reorderThreshold: ing.reorderThreshold,
        costPerUnit: ing.costPerUnit,
        supplier: lastSupplier || ing.supplier || "Local Market",
        status,
        stockValue: Math.round(ing.currentStock * ing.costPerUnit * 100) / 100,
        totalUsed: Math.round(totalUsed * 100) / 100,
        totalRestocked: Math.round(totalRestocked * 100) / 100,
        lastRestockedAt,
        recipeCount: ing.recipeItems?.length || 0,
        createdAt: ing.createdAt,
        updatedAt: ing.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      ingredients: enrichedIngredients,
      recentTransactions,
    });
  } catch (error: any) {
    console.error("Failed to fetch inventory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = stockAdjustmentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const {
      ingredientId,
      newIngredientName,
      unit,
      type,
      quantity,
      supplier,
      costPerUnit,
      totalCost,
      reason,
    } = parseResult.data;

    let targetIngredientId = ingredientId;

    // If new ingredient is specified or ingredientId doesn't exist, create/find it
    if (!targetIngredientId && newIngredientName) {
      const trimmedName = newIngredientName.trim();
      const existing = await prisma.ingredient.findFirst({
        where: { name: { equals: trimmedName } },
      });

      if (existing) {
        targetIngredientId = existing.id;
      } else {
        const created = await prisma.ingredient.create({
          data: {
            name: trimmedName,
            unit: unit?.trim() || "kg",
            currentStock: 0,
            reorderThreshold: Math.max(1, Math.round(quantity * 0.2)),
            costPerUnit: costPerUnit || 0,
            supplier: supplier?.trim() || null,
          },
        });
        targetIngredientId = created.id;
      }
    }

    if (!targetIngredientId) {
      return NextResponse.json(
        { success: false, error: "Ingredient ID or new ingredient name required" },
        { status: 400 }
      );
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: targetIngredientId },
    });

    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: "Ingredient not found" },
        { status: 404 }
      );
    }

    // Determine stock delta:
    // RESTOCK: positive (e.g. +1 kg, +2 kg)
    // WASTE: negative (e.g. -0.5 kg)
    // ADJUSTMENT: quantity directly
    let delta = Math.abs(quantity);
    if (type === "WASTE") {
      delta = -delta;
    } else if (type === "ADJUSTMENT") {
      delta = quantity;
    }

    const calculatedTotalCost =
      totalCost ??
      (costPerUnit && delta > 0 ? Math.round(costPerUnit * delta * 100) / 100 : null);

    const defaultReason =
      reason ||
      (type === "RESTOCK"
        ? `Received ${Math.abs(delta)} ${ingredient.unit} from ${supplier || "Supplier"}`
        : type === "WASTE"
        ? `Kitchen waste / loss: ${Math.abs(delta)} ${ingredient.unit}`
        : `Manual inventory adjustment: ${delta} ${ingredient.unit}`);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.ingredient.update({
        where: { id: targetIngredientId },
        data: {
          currentStock: {
            increment: delta,
          },
          ...(supplier && { supplier: supplier.trim() }),
          ...(costPerUnit && { costPerUnit }),
        },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          ingredientId: targetIngredientId,
          type,
          quantity: delta,
          supplier: supplier?.trim() || null,
          costPerUnit: costPerUnit || null,
          totalCost: calculatedTotalCost,
          reason: defaultReason,
        },
        include: {
          ingredient: true,
        },
      });

      return { ingredient: updated, transaction };
    });

    broadcastRealtimeEvent("STOCK_UPDATED", { ingredientId: targetIngredientId });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Failed to process stock receiving/adjustment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process stock: " + error.message },
      { status: 500 }
    );
  }
}

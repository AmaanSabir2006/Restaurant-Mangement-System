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
      },
      orderBy: { name: "asc" },
    });

    const recentTransactions = await prisma.stockTransaction.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        ingredient: true,
      },
    });

    // Add status calculation
    const enrichedIngredients = ingredients.map((ing) => {
      let status: "NORMAL" | "LOW" | "OUT_OF_STOCK" = "NORMAL";
      if (ing.currentStock <= 0) {
        status = "OUT_OF_STOCK";
      } else if (ing.currentStock <= ing.reorderThreshold) {
        status = "LOW";
      }

      return {
        ...ing,
        status,
        stockValue: Math.round(ing.currentStock * ing.costPerUnit * 100) / 100,
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

    const { ingredientId, type, quantity, reason } = parseResult.data;

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: "Ingredient not found" },
        { status: 404 }
      );
    }

    // Determine actual stock delta:
    // If WASTE: quantity is deducted (negative delta)
    // If RESTOCK: quantity is added (positive delta)
    // If ADJUSTMENT: positive adds, negative subtracts
    let delta = quantity;
    if (type === "WASTE" && delta > 0) {
      delta = -delta;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStock: {
            increment: delta,
          },
        },
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          ingredientId,
          type,
          quantity: delta,
          reason,
        },
        include: {
          ingredient: true,
        },
      });

      return { ingredient: updated, transaction };
    });

    broadcastRealtimeEvent("STOCK_UPDATED", { ingredientId });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Failed to process stock adjustment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process stock adjustment: " + error.message },
      { status: 500 }
    );
  }
}

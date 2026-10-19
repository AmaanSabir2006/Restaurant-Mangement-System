import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateMenuItemSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = {};
    if (category && category !== "All") {
      where.category = category;
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        modifiers: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: [{ category: "asc" }, { price: "asc" }],
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Failed to fetch menu items:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isAvailable, price } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Item ID required" }, { status: 400 });
    }

    const parsed = updateMenuItemSchema.safeParse({ isAvailable, price });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(typeof isAvailable === "boolean" && { isAvailable }),
        ...(typeof price === "number" && { price }),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Failed to update menu item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

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

    let items = await prisma.menuItem.findMany({
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

    // Auto-seed failsafe: If database has 0 items on serverless cold start, populate from seed data
    if (items.length === 0 && (!category || category === "All")) {
      try {
        const seedModule = await import("@/lib/seedMenuItems.json");
        const seedItems = seedModule.default || seedModule;
        if (Array.isArray(seedItems) && seedItems.length > 0) {
          console.log("[api/menu] Auto-seeding 100 menu items on serverless cold-start...");
          await prisma.menuItem.createMany({
            data: seedItems.map((s: any) => ({
              id: s.id,
              sku: s.sku,
              name: s.name,
              category: s.category,
              price: s.price,
              description: s.description || null,
              image: s.image || null,
              isAvailable: s.isAvailable !== false,
              prepTimeMin: s.prepTimeMin || 5,
              calories: s.calories || null,
              sizes: s.sizes || null,
            })),
          });

          items = await prisma.menuItem.findMany({
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
        }
      } catch (seedErr) {
        console.warn("[api/menu] Auto-seed fallback error:", seedErr);
      }
    }

    const formattedItems = items.map((item) => {
      let sizeOptions = undefined;
      if (item.sizes) {
        try {
          sizeOptions = JSON.parse(item.sizes);
        } catch {
          sizeOptions = undefined;
        }
      }
      return {
        ...item,
        sizeOptions,
      };
    });

    return NextResponse.json({ success: true, items: formattedItems });
  } catch (error: any) {
    console.error("Failed to fetch menu items:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu items: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isAvailable, price, sizes, name } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Item ID required" }, { status: 400 });
    }

    const parsed = updateMenuItemSchema.safeParse({ isAvailable, price, name, sizes });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isAvailable === "boolean") updateData.isAvailable = isAvailable;
    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (typeof price === "number" && price >= 0) updateData.price = Math.round(price * 100) / 100;

    if (sizes !== undefined) {
      if (typeof sizes === "string") {
        updateData.sizes = sizes;
      } else if (Array.isArray(sizes)) {
        updateData.sizes = JSON.stringify(sizes);
        // Automatically ensure base price aligns with lowest size price if not explicitly provided
        if (sizes.length > 0 && typeof price !== "number") {
          const minPrice = Math.min(...sizes.map((s: any) => Number(s.price) || 0));
          if (minPrice > 0) updateData.price = minPrice;
        }
      } else if (sizes === null) {
        updateData.sizes = null;
      }
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });

    let sizeOptions = undefined;
    if (updated.sizes) {
      try {
        sizeOptions = JSON.parse(updated.sizes);
      } catch {
        sizeOptions = undefined;
      }
    }

    return NextResponse.json({
      success: true,
      item: {
        ...updated,
        sizeOptions,
      },
    });
  } catch (error: any) {
    console.error("Failed to update menu item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update menu item: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}

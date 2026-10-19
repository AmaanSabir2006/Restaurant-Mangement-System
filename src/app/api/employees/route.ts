import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { role: "asc" },
    });

    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

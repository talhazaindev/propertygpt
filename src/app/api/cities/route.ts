import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cities - Get all cities from MongoDB
export async function GET(_req: NextRequest) {
  try {
    const cities = await prisma.city.findMany({
      select: { id: true, name: true, province: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}

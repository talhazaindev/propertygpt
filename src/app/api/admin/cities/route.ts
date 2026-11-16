import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import {
  requireStaff,
  StaffAuthError,
  staffUnauthorizedResponse,
} from "@/lib/staff-auth";

export async function GET(request: Request) {
  try {
    await requireStaff();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const province = searchParams.get("province");

    const where: Record<string, unknown> = {};

    if (query) {
      where.name = { contains: query, mode: "insensitive" };
    }

    if (province) {
      where.province = province;
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(cities);
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_CITIES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireStaff();

    const body = await request.json();
    const { name, province } = body;

    if (!name || !province) {
      return NextResponse.json(
        { error: "Name and province are required" },
        { status: 400 }
      );
    }

    const existingCity = await prisma.city.findUnique({
      where: { name },
    });

    if (existingCity) {
      return NextResponse.json(
        { error: "City with this name already exists" },
        { status: 400 }
      );
    }

    const city = await prisma.city.create({
      data: { name, province },
    });

    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_CITIES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

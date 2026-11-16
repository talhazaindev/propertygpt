import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import bcrypt from "bcrypt";
import {
  requireStaff,
  StaffAuthError,
  staffUnauthorizedResponse,
} from "@/lib/staff-auth";

const ALLOWED_TEAM_ROLES = new Set([
  "SUPER_ADMIN",
  "AREA_MANAGER",
  "PROPERTY_VERIFIER",
  "CONTENT_CREATOR",
  "CUSTOMER_SUPPORT",
  "INVENTORY_MANAGER",
]);

export async function GET(request: Request) {
  try {
    await requireStaff();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");
    const cityId = searchParams.get("cityId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10) || 10, 1),
      100
    );
    const skip = (Math.max(page, 1) - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phoneNumber: { contains: query, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (cityId) {
      where.cityId = cityId;
    }

    const [teamMembers, totalTeamMembers] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        include: {
          city: {
            select: { id: true, name: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.teamMember.count({ where }),
    ]);

    const safeTeamMembers = teamMembers.map(
      ({ hashedPassword: _, ...rest }) => rest
    );

    return NextResponse.json({
      teamMembers: safeTeamMembers,
      pagination: {
        total: totalTeamMembers,
        pages: Math.ceil(totalTeamMembers / limit),
        page: Math.max(page, 1),
        limit,
      },
    });
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_TEAM_GET]", error);
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
    const {
      name,
      email,
      password,
      role,
      phoneNumber,
      cityId,
      isActive = true,
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TEAM_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingTeamMember = await prisma.teamMember.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingTeamMember) {
      return NextResponse.json(
        { error: "Team member with this email already exists" },
        { status: 400 }
      );
    }

    let validatedCityId: string | null = null;
    if (cityId && cityId !== "none") {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(cityId);
      if (!isValidObjectId) {
        return NextResponse.json(
          { error: "Invalid city ID format" },
          { status: 400 }
        );
      }

      const city = await prisma.city.findUnique({
        where: { id: cityId },
      });

      if (!city) {
        return NextResponse.json({ error: "City not found" }, { status: 400 });
      }

      validatedCityId = cityId;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const teamMember = await prisma.teamMember.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
        role,
        ...(phoneNumber && { phoneNumber }),
        ...(validatedCityId && { cityId: validatedCityId }),
        isActive: isActive === true || isActive === "true",
      },
      include: {
        city: {
          select: { id: true, name: true },
        },
      },
    });

    const { hashedPassword: _, ...safeTeamMember } = teamMember;
    return NextResponse.json(safeTeamMember, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_TEAM_POST]", error);

    const prismaError = error as { code?: string; message?: string };
    if (prismaError?.code === "P2031") {
      return NextResponse.json(
        {
          error:
            "Database configuration error: MongoDB must be a replica set (Atlas provides this).",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: prismaError.message || "Internal server error" },
      { status: 500 }
    );
  }
}

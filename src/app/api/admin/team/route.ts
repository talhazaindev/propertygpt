import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import bcrypt from "bcrypt";

// Helper function to check admin access
const isAdminOrStaff = (request: Request) => {
  const headers = request.headers;
  return headers.get("x-admin-auth") === "true";
};

// GET all team members
export async function GET(request: Request) {
  try {
    if (!isAdminOrStaff(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");
    const cityId = searchParams.get("cityId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};

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

    const teamMembers = await prisma.teamMember.findMany({
      where,
      include: {
        city: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalTeamMembers = await prisma.teamMember.count({ where });

    return NextResponse.json({
      teamMembers,
      pagination: {
        total: totalTeamMembers,
        pages: Math.ceil(totalTeamMembers / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("[ADMIN_TEAM_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// CREATE a new team member
export async function POST(request: Request) {
  try {
    if (!isAdminOrStaff(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const existingTeamMember = await prisma.teamMember.findUnique({
      where: { email },
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
        email,
        hashedPassword,
        role,
        ...(phoneNumber && { phoneNumber }),
        ...(validatedCityId && { cityId: validatedCityId }),
        isActive: isActive === true || isActive === "true",
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { hashedPassword: _, ...safeTeamMember } = teamMember;
    return NextResponse.json(safeTeamMember, { status: 201 });
  } catch (error: any) {
    console.error("[ADMIN_TEAM_POST]", error);

    if (error?.code === "P2031") {
      return NextResponse.json(
        {
          error:
            "Database configuration error: MongoDB must be a replica set (Atlas provides this).",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

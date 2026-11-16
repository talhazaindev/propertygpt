import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prismadb";
import {
  requireStaff,
  StaffAuthError,
  staffUnauthorizedResponse,
} from "@/lib/staff-auth";

const ALLOWED_USER_ROLES = new Set(["ADMIN", "BUYER", "SELLER", "AGENT"]);

export async function GET(request: Request) {
  try {
    await requireStaff();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const role = searchParams.get("role");
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
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          phoneNumber: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
        page: Math.max(page, 1),
        limit,
      },
    });
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_USERS_GET]", error);
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
    const { name, email, password, role, phoneNumber } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ALLOWED_USER_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
        role,
        phoneNumber,
      },
    });

    const { hashedPassword: _, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_USERS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

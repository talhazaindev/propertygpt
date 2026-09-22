import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

export async function GET(request: Request) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause
    const where: any = {};
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    // Fetch users with pagination
    const users = await prisma.user.findMany({
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
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });
    
    return NextResponse.json({
      users,
      pagination: {
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    const body = await request.json();
    const { name, email, password, role, phoneNumber } = body;
    
    // Basic validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Hash password using bcrypt
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role,
        phoneNumber,
      }
    });
    
    // Remove sensitive information
    const { hashedPassword: _, ...safeUser } = user;
    
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_USERS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

// GET all cities
export async function GET(request: Request) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const province = searchParams.get('province');
    
    // Build the where clause
    const where: any = {};
    
    if (query) {
      where.name = { contains: query, mode: 'insensitive' };
    }
    
    if (province) {
      where.province = province;
    }
    
    // Fetch cities
    const cities = await prisma.city.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(cities);
  } catch (error) {
    console.error("[ADMIN_CITIES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// CREATE a new city
export async function POST(request: Request) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    const body = await request.json();
    const { name, province } = body;
    
    // Basic validation
    if (!name || !province) {
      return NextResponse.json(
        { error: "Name and province are required" },
        { status: 400 }
      );
    }
    
    // Check if city already exists
    const existingCity = await prisma.city.findUnique({
      where: { name }
    });
    
    if (existingCity) {
      return NextResponse.json(
        { error: "City with this name already exists" },
        { status: 400 }
      );
    }
    
    // Create the city
    const city = await prisma.city.create({
      data: {
        name,
        province
      }
    });
    
    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_CITIES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireStaff,
  StaffAuthError,
  staffUnauthorizedResponse,
} from "@/lib/staff-auth";

// Type for sales data
interface SaleData {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyType: string;
  area: number;
  city: string;
  price: number;
  commission: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  agentId: string | null;
  agentName: string | null;
  saleDate: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
}

// GET /api/admin/sales - Get all sales data from sold properties
export async function GET(request: NextRequest) {
  try {
    await requireStaff();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const searchTerm = searchParams.get("search");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    
    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get properties that have been sold - these are our "sales"
    const soldProperties = await prisma.property.findMany({
      where: {
        status: "SOLD",
        ...(searchTerm ? {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { address: { contains: searchTerm, mode: 'insensitive' } }
          ]
        } : {}),
        ...(fromDate || toDate ? {
          updatedAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate) } : {})
          }
        } : {})
      },
      include: {
        owner: true,
        city: true,
        verifiedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' }
    });
    
    // Transform properties into sale data
    const sales: SaleData[] = soldProperties.map(property => {
      // For this example, we'll use the owner as seller, and someone else as buyer
      // In a real app, you should have a proper sales relationship
      
      // Calculate price and commission based on stored values or defaults
      const price = property.price;
      const commission = price * 0.03; // Default 3% commission if not specified
      
      return {
        id: property.id,
        propertyId: property.id,
        propertyName: property.title,
        propertyType: property.type,
        area: property.area,
        city: property.city?.name || "Unknown",
        price,
        commission,
        buyerId: "some-buyer-id", // This would be the actual buyer ID in a real app
        buyerName: "Anonymous Buyer", // This would be the actual buyer name in a real app
        sellerId: property.ownerId,
        sellerName: property.owner?.name || "Unknown Seller",
        agentId: property.verifierId || null,
        agentName: property.verifiedBy?.name || null,
        saleDate: property.updatedAt.toISOString().split('T')[0], // Using updated date as sale date
        status: "COMPLETED" // Default status for completed sales
      };
    });

    // Get total count for pagination
    const total = await prisma.property.count({
      where: {
        status: "SOLD",
        ...(searchTerm ? {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { address: { contains: searchTerm, mode: 'insensitive' } }
          ]
        } : {}),
        ...(fromDate || toDate ? {
          updatedAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate) } : {})
          }
        } : {})
      }
    });
    
    // Get statistics from all sold properties
    const allSoldProperties = await prisma.property.findMany({
      where: { status: "SOLD" }
    });
    
    const totalSales = allSoldProperties.length;
    const totalRevenue = allSoldProperties.reduce((sum, property) => sum + property.price, 0);
    const totalCommission = totalRevenue * 0.03; // 3% commission
    
    // Calculate monthly sales
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySales = await prisma.property.count({
      where: {
        status: "SOLD",
        updatedAt: {
          gte: firstDayOfMonth
        }
      }
    });

    return NextResponse.json({ 
      sales, 
      pagination: { 
        page, 
        limit, 
        total, 
        pages: Math.ceil(total / limit) 
      },
      stats: {
        totalSales,
        totalRevenue,
        totalCommission,
        monthlySales
      }
    });
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

// POST /api/admin/sales/mark-as-sold - Mark a property as sold
export async function POST(request: NextRequest) {
  try {
    await requireStaff();

    const body = await request.json();
    const { propertyId, buyerId, notes, price, commission } = body;
    
    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }
    
    // Get property details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: true,
        city: true
      }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    
    // Calculate final sale price and commission
    const finalPrice = price || property.price;
    const finalCommission = commission !== undefined ? commission : (finalPrice * 0.03);
    
    // Update property status to SOLD
    // We can't update statusHistory safely because of schema issues
    // Just mark the property as SOLD for now
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: "SOLD",
        updatedAt: new Date() // Make sure this gets updated to reflect sale date
      }
    });
    
    // Create a sale data object to return
    const saleData: SaleData = {
      id: property.id,
      propertyId: property.id,
      propertyName: property.title,
      propertyType: property.type,
      area: property.area,
      city: property.city?.name || "Unknown",
      price: finalPrice,
      commission: finalCommission,
      buyerId: buyerId || "anonymous-buyer",
      buyerName: "Anonymous Buyer", // In a real app, you'd lookup the buyer's name
      sellerId: property.ownerId,
      sellerName: property.owner?.name || "Unknown Seller",
      agentId: property.verifierId || null,
      agentName: null, // We don't have access to verifiedBy.name here
      saleDate: new Date().toISOString().split('T')[0],
      status: "COMPLETED"
    };
    
    return NextResponse.json({ 
      success: true, 
      sale: saleData
    });
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("Error marking property as sold:", error);
    return NextResponse.json(
      { error: "Failed to mark property as sold" },
      { status: 500 }
    );
  }
} 
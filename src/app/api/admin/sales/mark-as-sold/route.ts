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
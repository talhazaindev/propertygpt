import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { updateConstructionStatusSchema } from "@/schemas/construction";
import {
  requireStaff,
  StaffAuthError,
  staffUnauthorizedResponse,
} from "@/lib/staff-auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();

    // Get ID from params (properly awaited)
    const { id } = await context.params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid ID format" 
      }, { status: 400 });
    }
    
    const { db } = await connectDB();
    
    const request = await db.collection("ConstructionRequest").findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!request) {
      return NextResponse.json({ 
        success: false, 
        message: "Construction request not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      request
    });
    
  } catch (error: any) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("Error fetching construction request:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to fetch construction request" 
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();
    
    // Get ID from params (properly awaited)
    const { id } = await context.params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid ID format" 
      }, { status: 400 });
    }
    
    const body = await req.json();
    
    // Validate request body
    const validated = updateConstructionStatusSchema.parse({
      id,
      status: body.status
    });
    
    const { db } = await connectDB();
    
    // Ensure request exists
    const existingRequest = await db.collection("ConstructionRequest").findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!existingRequest) {
      return NextResponse.json({ 
        success: false, 
        message: "Construction request not found" 
      }, { status: 404 });
    }
    
    // Update request status
    await db.collection("ConstructionRequest").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: validated.status,
          updatedAt: new Date()
        } 
      }
    );
    
    return NextResponse.json({
      success: true,
      message: "Construction request status updated successfully"
    });
    
  } catch (error: any) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("Error updating construction request:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to update construction request" 
    }, { status: 500 });
  }
} 
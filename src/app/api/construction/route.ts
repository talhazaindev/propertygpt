import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { constructionRequestSchema } from "@/schemas/construction";
import {
  requireStaff,
  StaffAuthError,
  staffUnauthorizedResponse,
} from "@/lib/staff-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body against schema
    const validated = constructionRequestSchema.parse(body);
    
    const { db } = await connectDB();
    
    // Add timestamps
    const requestData = {
      ...validated,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Insert into database
    const result = await db.collection("ConstructionRequest").insertOne(requestData);
    
    return NextResponse.json({ 
      success: true, 
      message: "Construction request submitted successfully",
      id: result.insertedId,
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Error creating construction request:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to submit construction request" 
    }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const status = searchParams.get("status") || null;
    
    const skip = (page - 1) * limit;
    
    const { db } = await connectDB();
    
    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    
    // Build sort options
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    
    // Get total count
    const totalCount = await db.collection("ConstructionRequest").countDocuments(query);
    
    // Get requests with pagination and sorting
    const requests = await db.collection("ConstructionRequest")
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      }
    });
    
  } catch (error: any) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("Error fetching construction requests:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to fetch construction requests" 
    }, { status: 500 });
  }
} 
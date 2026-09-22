import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { constructionRequestSchema } from "@/schemas/construction";
import { authOptions } from "@/lib/auth";

// Helper function to check if user is admin or staff
async function isAdminOrStaff(req: NextRequest) {
  // Check session-based authentication (NextAuth)
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    // Check if user is admin
    if (session.user.role === "ADMIN") return true;
    
    // Check if user is a team member
    if (session.user.isTeamMember) return true;
    
    // Check if email has company domain
    if (typeof session.user.email === 'string' && session.user.email.includes("@propertygpt.com")) return true;
  }
  
  // Check custom admin authentication header (for admin dashboard)
  const adminAuthHeader = req.headers.get('x-admin-auth');
  if (adminAuthHeader === 'true') {
    return true;
  }
  
  return false;
}

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
    // Check admin/staff authorization
    const isAuthorized = await isAdminOrStaff(req);
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 403 });
    }
    
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
    console.error("Error fetching construction requests:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to fetch construction requests" 
    }, { status: 500 });
  }
} 
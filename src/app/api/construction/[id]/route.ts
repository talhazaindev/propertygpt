import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { updateConstructionStatusSchema } from "@/schemas/construction";
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

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check admin/staff authorization
    const isAuthorized = await isAdminOrStaff(req);
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 403 });
    }

    // Get ID from params (properly awaited)
    const id = context.params.id;
    
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
    console.error("Error fetching construction request:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to fetch construction request" 
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check admin/staff authorization
    const isAuthorized = await isAdminOrStaff(req);
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 403 });
    }
    
    // Get ID from params (properly awaited)
    const id = context.params.id;
    
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
    console.error("Error updating construction request:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to update construction request" 
    }, { status: 500 });
  }
} 
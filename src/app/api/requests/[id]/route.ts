import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { updateRequestStatusSchema } from "@/schemas/request";
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

interface RequestParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RequestParams) {
  try {
    // Check admin/staff authorization
    const isAuthorized = await isAdminOrStaff(request);
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid request ID" 
      }, { status: 400 });
    }
    
    const { db } = await connectDB();
    
    // Get request by ID
    const propertyRequest = await db.collection("PropertyRequest").findOne({
      _id: new ObjectId(id)
    });
    
    if (!propertyRequest) {
      return NextResponse.json({ 
        success: false, 
        message: "Property request not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      request: propertyRequest
    });
    
  } catch (error: any) {
    console.error("Error fetching property request:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to fetch property request" 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RequestParams) {
  try {
    // Check admin/staff authorization
    const isAuthorized = await isAdminOrStaff(request);
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid request ID" 
      }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Only allow updating a select few fields
    const updateData: any = {};
    
    if (body.status) {
      updateData.status = body.status;
    }
    
    if (body.adminNotes) {
      updateData.adminNotes = body.adminNotes;
    }
    
    if (body.assignedToId) {
      if (!ObjectId.isValid(body.assignedToId)) {
        return NextResponse.json({ 
          success: false, 
          message: "Invalid team member ID" 
        }, { status: 400 });
      }
      updateData.assignedToId = new ObjectId(body.assignedToId);
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "No valid update fields provided" 
      }, { status: 400 });
    }
    
    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();
    
    const { db } = await connectDB();
    
    // Update the request
    const result = await db.collection("PropertyRequest").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Property request not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Property request updated successfully"
    });
    
  } catch (error: any) {
    console.error("Error updating property request:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to update property request" 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RequestParams) {
  try {
    // Check admin authorization (only admins can delete)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid request ID" 
      }, { status: 400 });
    }
    
    const { db } = await connectDB();
    
    // Delete the request
    const result = await db.collection("PropertyRequest").deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Property request not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Property request deleted successfully"
    });
    
  } catch (error: any) {
    console.error("Error deleting property request:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to delete property request" 
    }, { status: 500 });
  }
} 
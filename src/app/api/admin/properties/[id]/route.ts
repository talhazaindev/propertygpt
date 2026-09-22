import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

// Helper function to check if user is admin
async function isAdminOrStaff(req: NextRequest) {
  // OPTION 1: Check session-based authentication (NextAuth)
  const session = await getServerSession(authOptions);
  console.log("Session in property API:", session);
  
  if (session?.user) {
    // Check if user is admin or staff
    if (session.user.role === "ADMIN") return true;
    
    // Check if user is a team member
    if (session.user.isTeamMember) return true;
    
    // Check if email has company domain
    if (typeof session.user.email === 'string' && session.user.email.includes("@propertygpt.com")) return true;
  }
  
  // OPTION 2: Check custom admin authentication header (for admin dashboard)
  const adminAuthHeader = req.headers.get('x-admin-auth');
  if (adminAuthHeader === 'true') {
    return true;
  }
  
  return false;
}

// GET /api/admin/properties/:id - Get a property by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    if (!await isAdminOrStaff(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Get property ID from params
    const { id: propertyId } = await params;
    console.log("Fetching property with ID:", propertyId);
    
    // First attempt: Get the property with all relations
    let property;
    try {
      property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          owner: true,
          city: true,
          verifiedBy: true
        }
      });
      
      console.log("Property found with owner relation:", property?.owner ? "Owner exists" : "Owner missing");
    } catch (error) {
      console.error("Error in first property fetch attempt:", error);
      
      // Second attempt: Try without relations
      try {
        property = await prisma.property.findUnique({
          where: { id: propertyId }
        });
        console.log("Found property without relations:", property ? "Yes" : "No");
        
        // If property exists, try to fetch owner separately
        if (property) {
          try {
            const owner = await prisma.user.findUnique({
              where: { id: property.ownerId }
            });
            console.log("Owner lookup result:", owner ? "Found owner" : "Owner not found");
            
            // Manually attach the owner
            if (owner) {
              property = {
                ...property,
                owner
              };
            }
          } catch (ownerError) {
            console.error("Error fetching owner separately:", ownerError);
          }
        }
      } catch (secondError) {
        console.error("Error in second property fetch attempt:", secondError);
        throw secondError;
      }
    }
    
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    
    // Create a safe response with default values
    const propertyData = JSON.parse(JSON.stringify(property));
    
    // Add the owner if missing
    if (!propertyData.owner) {
      propertyData.owner = { 
        id: null, 
        name: "Unknown", 
        email: "Not available" 
      };
    }
    
    // Ensure these required fields exist
    if (!propertyData.images) propertyData.images = [];
    if (!propertyData.city) propertyData.city = null;
    if (!propertyData.verifiedBy) propertyData.verifiedBy = null;
    if (!propertyData.rejectionReason) propertyData.rejectionReason = null;
    
    console.log("Returning property with owner data:", 
      propertyData.owner ? `Owner: ${propertyData.owner.name}` : "No owner data");
    
    return NextResponse.json(propertyData);
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/properties/:id - Update property verification status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    if (!await isAdminOrStaff(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const { id: propertyId } = await params;
    console.log("PATCH request for property ID:", propertyId);
    
    // Validate property ID format
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      console.error("Invalid ObjectId format:", propertyId);
      return NextResponse.json(
        { error: "Invalid property ID format" },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    console.log("Session in PATCH request:", session?.user?.email);
    
    const body = await request.json();
    console.log("Request body:", body);
    
    const { status, rejectionReason, verifiedAt } = body;
    
    if (!status || !['PENDING', 'VERIFIED', 'REJECTED', 'ACTIVE', 'SOLD'].includes(status)) {
      console.log("Invalid status provided:", status);
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      );
    }
    
    // If rejecting, require a reason
    if (status === "REJECTED" && !rejectionReason) {
      console.log("Missing rejection reason for REJECTED status");
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }
    
    // Get current team member from database using session email
    let teamMember = null;
    if (session?.user?.email) {
      teamMember = await prisma.teamMember.findUnique({
        where: { email: session.user.email }
      });
      console.log("Team member found from session:", teamMember ? "Yes" : "No");
    }
    
    // If no team member found from session, try to find any superadmin as fallback
    if (!teamMember && ['VERIFIED', 'ACTIVE', 'REJECTED'].includes(status)) {
      console.log("No team member from session, searching for a superadmin...");
      teamMember = await prisma.teamMember.findFirst({
        where: { 
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log("Found superadmin team member:", teamMember ? teamMember.email : "No");
    }
    
    // Extra fallback - use any active team member
    if (!teamMember && ['VERIFIED', 'ACTIVE', 'REJECTED'].includes(status)) {
      console.log("No superadmin found, searching for any active team member...");
      teamMember = await prisma.teamMember.findFirst({
        where: { isActive: true }
      });
      console.log("Found any team member:", teamMember ? teamMember.email : "No");
    }

    if (!teamMember && ['VERIFIED', 'ACTIVE', 'REJECTED'].includes(status)) {
      console.log("Team member required but not found");
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }
    
    console.log("Updating property with status:", status);
    
    // Use the verifiedAt from the request or create a new date
    const verificationDate = verifiedAt ? new Date(verifiedAt) : new Date();
    
    try {
      // Use MongoDB client directly to avoid transaction issues
      const client = await clientPromise;
      const db = client.db();
      const propertiesCollection = db.collection('Property');
      
      // Prepare update data
      const updateData: Record<string, any> = {
        status,
        updatedAt: new Date()
      };
      
      // Add verification details if applicable
      if (['VERIFIED', 'ACTIVE'].includes(status)) {
        updateData.verifiedAt = verificationDate;
        updateData.verifierId = teamMember ? new ObjectId(teamMember.id) : null;
      }
      
      // Add rejection reason if applicable
      if (status === 'REJECTED') {
        updateData.rejectionReason = rejectionReason;
        updateData.verifierId = teamMember ? new ObjectId(teamMember.id) : null;
      }
      
      console.log("Converting property ID to ObjectId:", propertyId);
      const objectId = new ObjectId(propertyId);
      console.log("ObjectId created successfully:", objectId.toString());
      
      // Update property using MongoDB directly
      const result = await propertiesCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      if (!result || !result.value) {
        console.error("Property not found with ID:", propertyId);
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }
      
      console.log("Property updated successfully with status:", result.value.status);
      
      // Format the response
      const property = result.value;
      const response = {
        id: property._id.toString(),
        title: property.title,
        description: property.description,
        price: property.price,
        type: property.type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        address: property.address,
        status: property.status,
        featured: property.featured,
        images: property.images,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        verifiedAt: property.verifiedAt,
        rejectionReason: property.rejectionReason,
        verifiedBy: teamMember ? {
          id: teamMember.id,
          name: teamMember.name,
          role: teamMember.role
        } : null
      };
      
      return NextResponse.json(response);
    } catch (mongoError) {
      console.error("MongoDB error:", mongoError);
      return NextResponse.json(
        { error: "Database operation failed", details: (mongoError as Error).message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error updating property:", error);
    console.error("Error details:", error.message);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/properties/:id - Update property details
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    if (!await isAdminOrStaff(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const { id: propertyId } = await params;
    
    // Validate property ID format
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      console.error("Invalid ObjectId format:", propertyId);
      return NextResponse.json(
        { error: "Invalid property ID format" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Prevent updating certain fields
    const { ownerId, createdAt, _id, id, ...propertyData } = body;
    
    // Add updatedAt field
    propertyData.updatedAt = new Date();
    
    try {
      // Use MongoDB client directly to avoid transaction issues
      const client = await clientPromise;
      const db = client.db();
      const propertiesCollection = db.collection('Property');
      
      const objectId = new ObjectId(propertyId);
      
      // Update property using MongoDB directly
      const result = await propertiesCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: propertyData },
        { returnDocument: 'after' }
      );
      
      if (!result || !result.value) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }
      
      // Format the response
      const property = result.value;
      const response = {
        id: property._id.toString(),
        ...property,
        _id: undefined
      };
      
      return NextResponse.json(response);
    } catch (mongoError) {
      console.error("MongoDB error:", mongoError);
      return NextResponse.json(
        { error: "Database operation failed", details: (mongoError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating property details:", error);
    return NextResponse.json(
      { error: "Failed to update property details" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/properties/:id - Delete a property
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    if (!await isAdminOrStaff(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const { id: propertyId } = await params;
    
    // Validate property ID format
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      console.error("Invalid ObjectId format:", propertyId);
      return NextResponse.json(
        { error: "Invalid property ID format" },
        { status: 400 }
      );
    }
    
    try {
      // Use MongoDB client directly to avoid transaction issues
      const client = await clientPromise;
      const db = client.db();
      const propertiesCollection = db.collection('Property');
      
      const objectId = new ObjectId(propertyId);
      
      // Delete property using MongoDB directly
      const result = await propertiesCollection.deleteOne(
        { _id: objectId }
      );
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true });
    } catch (mongoError) {
      console.error("MongoDB error:", mongoError);
      return NextResponse.json(
        { error: "Database operation failed", details: (mongoError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
} 
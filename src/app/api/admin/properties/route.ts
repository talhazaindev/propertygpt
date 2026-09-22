import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

// Helper function to check if user is admin
async function isAdminOrStaff(req: NextRequest) {
  // OPTION 1: Check session-based authentication (NextAuth)
  const session = await getServerSession(authOptions);
  console.log("Session in API:", session);
  
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

// GET /api/admin/properties - Get all properties for admin
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    if (!await isAdminOrStaff(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const listingType = searchParams.get("listingType");
    const searchTerm = searchParams.get("search");
    
    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build Prisma filter
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (listingType) filter.listingType = listingType;
    if (searchTerm) {
      filter.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Get properties with related data, fallback if city relation breaks
    let properties;
    try {
      properties = await prisma.property.findMany({
        where: filter,
        include: {
          owner: true,
          city: { select: { id: true, name: true } },
          verifiedBy: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      console.error('Prisma fetch failed, retrying without city relation:', error);
      
      // Try without the problematic relations
      try {
        // First attempt: remove city relation
        properties = await prisma.property.findMany({
          where: filter,
          include: {
            owner: true,
            verifiedBy: { select: { id: true, name: true } }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        });
      } catch (secondError: any) {
        console.error('Second attempt failed, retrying with minimal relations:', secondError);
        
        // Second attempt: fetch with minimal relations
        properties = await prisma.property.findMany({
          where: filter,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        });
      }
    }
    // Get total count for pagination
    const total = await prisma.property.count({ where: filter });
    return NextResponse.json({ properties, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching properties for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/properties/:id - Update property verification status
export async function PATCH(request: NextRequest) {
  try {
    // Check admin access
    if (!await isAdminOrStaff(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    
    // Get property ID from request body or query parameters
    let id;
    if (body.id) {
      id = body.id;
    } else {
      // Look for id in the URL path
      const urlParts = request.url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart !== 'properties') {
        id = lastPart;
      } else {
        // Fallback to query param
        id = searchParams.get('id');
      }
    }
    
    const { status, rejectionReason, verifiedAt } = body;
    
    console.log("PATCH request for property - ID from route or body:", id);
    console.log("Session email:", session?.user?.email);
    console.log("Status:", status);
    
    if (!id) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }
    
    // Validate property ID format
    if (!ObjectId.isValid(id)) {
      console.error("Invalid ObjectId format:", id);
      return NextResponse.json(
        { error: "Invalid property ID format" },
        { status: 400 }
      );
    }
    
    if (!status || !["PENDING", "VERIFIED", "REJECTED", "ACTIVE", "SOLD"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      );
    }
    
    // If rejecting, require a reason
    if (status === "REJECTED" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }
    
    // Get current team member from database
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
    
    console.log("Team member found:", teamMember ? "Yes" : "No");
    
    if (!teamMember && ['VERIFIED', 'ACTIVE', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }
    
    try {
      // Use MongoDB client directly to avoid transaction issues
      const client = await clientPromise;
      const db = client.db();
      const propertiesCollection = db.collection('Property');
      
      // Use the verifiedAt from the request or create a new date
      const verificationDate = verifiedAt ? new Date(verifiedAt) : new Date();
      
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
      
      console.log("Converting property ID to ObjectId:", id);
      const objectId = new ObjectId(id);
      console.log("ObjectId created successfully:", objectId.toString());
      
      // Update property using MongoDB directly
      const result = await propertiesCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      if (!result || !result.value) {
        console.error("Property not found with ID:", id);
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
export async function PUT(request: NextRequest) {
  try {
    // Check admin access
    if (!await isAdminOrStaff(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    
    // Get property ID from request body or query parameters
    let id;
    if (body.id) {
      id = body.id;
    } else {
      // Look for id in the URL path
      const urlParts = request.url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart !== 'properties') {
        id = lastPart;
      } else {
        // Fallback to query param
        id = searchParams.get('id');
      }
    }
    
    if (!id) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }
    
    // Validate property ID format
    if (!ObjectId.isValid(id)) {
      console.error("Invalid ObjectId format:", id);
      return NextResponse.json(
        { error: "Invalid property ID format" },
        { status: 400 }
      );
    }
    
    // Make a copy of the body and remove id to avoid updating it
    const { id: _, ...propertyData } = body;
    
    // Prevent updating certain fields
    delete propertyData.ownerId;
    delete propertyData.createdAt;
    delete propertyData._id;
    
    // Add updatedAt field
    propertyData.updatedAt = new Date();
    
    try {
      // Use MongoDB client directly to avoid transaction issues
      const client = await clientPromise;
      const db = client.db();
      const propertiesCollection = db.collection('Property');
      
      const objectId = new ObjectId(id);
      
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
  } catch (error: any) {
    console.error("Error updating property details:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update property details" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/properties?id=123 - Delete a property
export async function DELETE(request: NextRequest) {
  try {
    // Check admin access
    if (!await isAdminOrStaff(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }
    
    // Validate property ID format
    if (!ObjectId.isValid(id)) {
      console.error("Invalid ObjectId format:", id);
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
      
      const objectId = new ObjectId(id);
      
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
  } catch (error: any) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
} 
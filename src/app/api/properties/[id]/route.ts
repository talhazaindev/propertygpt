import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET a single property
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid property ID" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    const propertiesCollection = db.collection('Property');
    
    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id)
    });
    
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    
    // Check access permissions
    const isOwner = session?.user?.id === property.ownerId.toString();
    const isAdmin = session?.user?.role === "ADMIN";
    const isPublic = ["VERIFIED", "ACTIVE"].includes(property.status);
    
    if (!isPublic && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to view this property" },
        { status: 403 }
      );
    }
    
    // Fetch city data
    const citiesCollection = db.collection('City');
    const city = property.cityId 
      ? await citiesCollection.findOne({ _id: property.cityId }) 
      : null;
    
    // Fetch verification info if available
    let verifier = null;
    if (property.verifierId) {
      const teamCollection = db.collection('TeamMember');
      const verifierDoc = await teamCollection.findOne({ _id: property.verifierId });
      if (verifierDoc) {
        verifier = {
          id: verifierDoc._id.toString(),
          name: verifierDoc.name,
          role: verifierDoc.role
        };
      }
    }
    
    // Fetch owner info if available
    let owner = null;
    if (property.ownerId) {
      try {
        const usersCollection = db.collection('User');
        const ownerDoc = await usersCollection.findOne({ _id: property.ownerId });
        if (ownerDoc) {
          owner = {
            id: ownerDoc._id.toString(),
            name: ownerDoc.name,
            email: ownerDoc.email,
            phone: ownerDoc.phoneNumber
          };
        }
      } catch (ownerError) {
        console.error("[OWNER_FETCH_ERROR]", ownerError);
        // Continue without owner info if there's an error
      }
    }
    
    // Format property for response
    const formattedProperty = {
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
      city: city ? {
        id: city._id.toString(),
        name: city.name,
        province: city.province
      } : null,
      owner: owner || { id: null, name: "Unknown", email: null },
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      verifiedAt: property.verifiedAt,
      verifiedBy: verifier,
      rejectionReason: property.rejectionReason,
      ownerId: property.ownerId ? property.ownerId.toString() : null,
      // Include tracking information for property owners
      tracking: isOwner || isAdmin ? {
        pendingSince: property.status === "PENDING" ? property.createdAt : null,
        verificationDate: property.verifiedAt,
        estimatedCompletionDate: property.status === "PENDING" 
          ? new Date(property.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days from creation
          : null,
        status: property.status,
        statusHistory: property.statusHistory || []
      } : null
    };
    
    return NextResponse.json(formattedProperty);
  } catch (error) {
    console.error("[PROPERTY_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

// PATCH to update a property
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid property ID" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    const propertiesCollection = db.collection('Property');
    
    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id)
    });
    
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    
    // Check permissions - only owner or admin can update
    const isOwner = session.user.id === property.ownerId.toString();
    const isAdmin = session.user.role === "ADMIN";
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this property" },
        { status: 403 }
      );
    }
    
    const formData = await req.formData();
    const updateData: any = {};
    const now = new Date();
    
    // Handle status updates (only admin can change status)
    const newStatus = formData.get("status") as string;
    if (newStatus && isAdmin) {
      updateData.status = newStatus;
      
      // Record status history
      const statusChange = {
        from: property.status,
        to: newStatus,
        changedAt: now,
        changedBy: session.user.id
      };
      
      updateData.statusHistory = [
        ...(property.statusHistory || []),
        statusChange
      ];
      
      // Add verification info if status is changing to VERIFIED
      if (newStatus === "VERIFIED") {
        updateData.verifiedAt = now;
        updateData.verifierId = new ObjectId(session.user.id);
      }
      
      // Add rejection reason if status is REJECTED
      const rejectionReason = formData.get("rejectionReason") as string;
      if (newStatus === "REJECTED" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
    }
    
    // Owners can update basic property info
    if (isOwner) {
      const fields = [
        "title", "description", "price", "bedrooms", 
        "bathrooms", "area", "address"
      ];
      
      fields.forEach(field => {
        const value = formData.get(field);
        if (value !== null && value !== undefined) {
          // Convert numeric fields
          if (["price", "area"].includes(field)) {
            updateData[field] = Number(value);
          } else if (["bedrooms", "bathrooms"].includes(field)) {
            updateData[field] = value === "" ? null : Number(value);
          } else {
            updateData[field] = value;
          }
        }
      });
    }
    
    // Update property if there are changes
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = now;
      
      const result = await propertiesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      
      if (!result.matchedCount) {
        return NextResponse.json(
          { error: "Failed to update property" },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: "Property updated successfully",
        id,
        ...updateData
      });
    }
    
    return NextResponse.json({
      message: "No changes to update",
      id
    });
    
  } catch (error) {
    console.error("[PROPERTY_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE a property
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid property ID" },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    const propertiesCollection = db.collection('Property');
    
    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id)
    });
    
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }
    
    // Check permissions - only owner or admin can delete
    const isOwner = session.user.id === property.ownerId.toString();
    const isAdmin = session.user.role === "ADMIN";
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this property" },
        { status: 403 }
      );
    }
    
    // Delete the property
    const result = await propertiesCollection.deleteOne({
      _id: new ObjectId(id)
    });
    
    if (!result.deletedCount) {
      return NextResponse.json(
        { error: "Failed to delete property" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Property deleted successfully",
      id
    });
    
  } catch (error) {
    console.error("[PROPERTY_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
} 
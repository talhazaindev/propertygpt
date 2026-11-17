import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  canAccessVerificationDocuments,
  toSafeVerificationDocuments,
} from "@/lib/verification-documents";
import { resolveStaffActor } from "@/lib/staff-auth";
import { absoluteMediaUrls, isAllowedMediaUrl } from "@/lib/media-url";
import {
  AuthError,
  authErrorResponse,
  optionalAuth,
  requireAuth,
} from "@/lib/require-auth";
import { propertyOwnerUpdateSchema } from "@/schemas/property";

// GET a single property
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await optionalAuth(req);
    const session = actor
      ? {
          user: {
            id: actor.userId,
            role: actor.role,
            isTeamMember: actor.kind === "web" ? actor.isTeamMember : false,
          },
        }
      : null;

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
    const ownerId = property.ownerId ? property.ownerId.toString() : null;
    const assignedAgentId = property.assignedAgentId
      ? property.assignedAgentId.toString()
      : null;
    const isOwner = Boolean(session?.user?.id && session.user.id === ownerId);
    const staff = await resolveStaffActor();
    const isStaff = Boolean(staff);
    const isPublic = ["VERIFIED", "ACTIVE"].includes(property.status);

    if (!isPublic && !isOwner && !isStaff) {
      return NextResponse.json(
        { error: "You don't have permission to view this property" },
        { status: 403 }
      );
    }

    const canViewVerificationDocs = await canAccessVerificationDocuments(
      {
        id: property._id.toString(),
        ownerId,
        assignedAgentId,
      },
      session
    );
    
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
    
    // Fetch owner info if available (trust profile stays on /agents/[id], not listings)
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
            phoneNumber: ownerDoc.phoneNumber || null,
            phone: ownerDoc.phoneNumber || null,
            role: ownerDoc.role || null,
            image: ownerDoc.image || null,
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
      listingType: property.listingType || "SALE",
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      address: property.address,
      status: property.status,
      featured: property.featured,
      contactPhone: property.contactPhone || null,
      images: absoluteMediaUrls(property.images || [], req.nextUrl.origin),
      // Never expose durable verification document URLs on the public detail payload.
      verificationDocuments: canViewVerificationDocs
        ? toSafeVerificationDocuments(
            property._id.toString(),
            property.verificationDocuments
          )
        : undefined,
      hasVerificationDocuments: Array.isArray(property.verificationDocuments)
        ? property.verificationDocuments.length > 0
        : false,
      city: city
        ? {
            id: city._id.toString(),
            name: city.name,
            province: city.province,
          }
        : null,
      owner: canViewVerificationDocs || isOwner || isStaff
        ? owner || { id: null, name: "Unknown", email: null }
        : owner
          ? {
              id: owner.id,
              name: owner.name,
              email: null,
              phoneNumber: null,
              phone: null,
              role: owner.role,
              image: owner.image,
            }
          : { id: null, name: "Unknown", email: null },
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      verifiedAt: property.verifiedAt,
      verifiedBy: verifier,
      rejectionReason: isOwner || isStaff ? property.rejectionReason : null,
      ownerId: ownerId,
      tracking:
        isOwner || isStaff
          ? {
              pendingSince:
                property.status === "PENDING" ? property.createdAt : null,
              verificationDate: property.verifiedAt,
              estimatedCompletionDate:
                property.status === "PENDING"
                  ? new Date(
                      property.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000
                    )
                  : null,
              status: property.status,
              statusHistory: property.statusHistory || [],
            }
          : null,
    };
    
    return NextResponse.json(formattedProperty);
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
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
    const actor = await requireAuth(req);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const propertiesCollection = db.collection("Property");

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const isOwner = actor.userId === property.ownerId.toString();
    const isAdmin = actor.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to update this property" },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    const updateData: Record<string, unknown> = {};
    const now = new Date();
    let ownerMaterialEdit = false;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const parsed = propertyOwnerUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: parsed.error.issues[0]?.message || "Invalid update payload",
            details: parsed.error.issues,
          },
          { status: 400 }
        );
      }

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "You don't have permission to update this property" },
          { status: 403 }
        );
      }

      const data = parsed.data;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.listingType !== undefined) updateData.listingType = data.listingType;
      if (data.bedrooms !== undefined) updateData.bedrooms = data.bedrooms;
      if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms;
      if (data.area !== undefined) updateData.area = data.area;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.cityId !== undefined) {
        if (!ObjectId.isValid(data.cityId)) {
          return NextResponse.json({ error: "Invalid cityId" }, { status: 400 });
        }
        updateData.cityId = new ObjectId(data.cityId);
      }
      if (data.imageUrls !== undefined) {
        if (!data.imageUrls.every(isAllowedMediaUrl)) {
          return NextResponse.json(
            { error: "One or more image URLs are not allowed" },
            { status: 400 }
          );
        }
        updateData.images = data.imageUrls;
      }

      ownerMaterialEdit = Object.keys(updateData).length > 0;
    } else {
      const formData = await req.formData();

      // Handle status updates (only admin can change status)
      const newStatus = formData.get("status") as string;
      if (newStatus && isAdmin) {
        updateData.status = newStatus;

        const statusChange = {
          from: property.status,
          to: newStatus,
          changedAt: now,
          changedBy: actor.userId,
        };

        updateData.statusHistory = [
          ...(property.statusHistory || []),
          statusChange,
        ];

        if (newStatus === "VERIFIED") {
          updateData.verifiedAt = now;
          updateData.verifierId = new ObjectId(actor.userId);
        }

        const rejectionReason = formData.get("rejectionReason") as string;
        if (newStatus === "REJECTED" && rejectionReason) {
          updateData.rejectionReason = rejectionReason;
        }
      }

      // Owners can update basic property info
      if (isOwner) {
        const fields = [
          "title",
          "description",
          "price",
          "bedrooms",
          "bathrooms",
          "area",
          "address",
        ];

        fields.forEach((field) => {
          const value = formData.get(field);
          if (value !== null && value !== undefined) {
            if (["price", "area"].includes(field)) {
              updateData[field] = Number(value);
            } else if (["bedrooms", "bathrooms"].includes(field)) {
              updateData[field] = value === "" ? null : Number(value);
            } else {
              updateData[field] = value;
            }
          }
        });
        ownerMaterialEdit = fields.some((field) => formData.get(field) != null);
      }
    }

    // Material owner edits of live listings go back to review.
    if (
      isOwner &&
      ownerMaterialEdit &&
      ["VERIFIED", "ACTIVE"].includes(String(property.status))
    ) {
      updateData.status = "PENDING";
      updateData.verifiedAt = null;
      updateData.rejectionReason = null;
      updateData.statusHistory = [
        ...(property.statusHistory || []),
        {
          from: property.status,
          to: "PENDING",
          changedAt: now,
          changedBy: actor.userId,
          note: "Owner edited listing — re-verification required",
        },
      ];
    }

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
        status: updateData.status ?? property.status,
      });
    }

    return NextResponse.json({
      message: "No changes to update",
      id,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
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
    const actor = await requireAuth(req);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid property ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const propertiesCollection = db.collection("Property");

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const isOwner = actor.userId === property.ownerId.toString();
    const isAdmin = actor.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this property" },
        { status: 403 }
      );
    }

    const result = await propertiesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (!result.deletedCount) {
      return NextResponse.json(
        { error: "Failed to delete property" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Property deleted successfully",
      id,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[PROPERTY_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
} 
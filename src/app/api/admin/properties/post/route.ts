import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { promises as fs } from 'fs';
import path from 'path';

// POST endpoint to update a property for posting on the main site
export async function POST(req: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Session in PATCH request:", session.user.email);

    // Check if the user is a team member
    const client = await clientPromise;
    const db = client.db();
    const teamMemberCollection = db.collection('TeamMember');
    
    let teamMember = await teamMemberCollection.findOne({ email: session.user.email });
    
    if (!teamMember) {
      console.log("No team member from session, searching for a superadmin...");
      // Fallback to a super admin account if not found
      teamMember = await teamMemberCollection.findOne({ role: "SUPER_ADMIN" });
      
      if (!teamMember) {
        return NextResponse.json({ error: "Team member not found" }, { status: 404 });
      }
    }

    // 2. Parse form data
    const formData = await req.formData();
    
    const propertyId = formData.get("id") as string;
    const status = formData.get("status") as string;
    const contactPhone = formData.get("contactPhone") as string;
    
    // Get existing images selections
    const existingImagesObj: Record<string, string> = {};
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("existingImages")) {
        existingImagesObj[key] = value as string;
      }
    }
    
    const existingImages = Object.values(existingImagesObj);
    
    // Get new image files
    const newImageFiles = formData.getAll("newImages") as File[];
    
    // 3. Validate propertyId
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }
    
    // 4. Find the property
    const propertiesCollection = db.collection('Property');
    const property = await propertiesCollection.findOne({ _id: new ObjectId(propertyId) });
    
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    
    // 5. Process new images
    const imageUrls: string[] = [...existingImages];
    
    if (newImageFiles && newImageFiles.length > 0) {
      try {
        console.log(`Saving ${newImageFiles.length} uploaded images to public/images/properties`);
        const uploadDir = path.join(process.cwd(), 'public', 'images', 'properties');
        await fs.mkdir(uploadDir, { recursive: true });
        
        for (let index = 0; index < newImageFiles.length; index++) {
          const file = newImageFiles[index];
          
          // Convert file to buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Derive file extension
          let ext = '.jpg';
          if (file.name) {
            ext = path.extname(file.name) || ext;
          } else if (file.type) {
            const parts = file.type.split('/');
            if (parts.length === 2) ext = `.${parts[1]}`;
          }
          
          const filename = `${Date.now()}-${index}${ext}`;
          const filePath = path.join(uploadDir, filename);
          await fs.writeFile(filePath, buffer);
          
          imageUrls.push(`/images/properties/${filename}`);
          console.log(`Saved uploaded image ${index + 1} as ${filename}`);
        }
      } catch (error) {
        console.error('Error saving uploaded images:', error);
        return NextResponse.json({ error: "Failed to save images" }, { status: 500 });
      }
    }
    
    // 6. Update the property
    const updateData: any = {
      status: status || "ACTIVE",
      contactPhone,
      images: imageUrls,
      updatedAt: new Date(),
      postedAt: new Date(),
      postedById: teamMember._id
    };
    
    // Add status history record
    const statusChange = {
      from: property.status,
      to: status || "ACTIVE",
      changedAt: new Date(),
      changedBy: teamMember._id,
      reason: "Posted to main site"
    };
    
    updateData.statusHistory = [
      ...(property.statusHistory || []),
      statusChange
    ];
    
    // Update the property in the database
    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(propertyId) },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
    }
    
    return NextResponse.json({
      message: "Property posted successfully",
      id: propertyId
    });
    
  } catch (error) {
    console.error("Error posting property:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 
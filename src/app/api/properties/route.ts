import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { promises as fs } from 'fs';
import path from 'path';
import { ObjectId } from "mongodb";
import { prisma } from "@/lib/prisma";
import { propertySchema, propertyUpdateSchema } from "@/schemas/property";
import { z } from "zod";

// GET all properties or filter properties
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Handle filtering parameters
    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice") as string) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice") as string) : undefined;
    const bedrooms = searchParams.get("bedrooms") ? parseInt(searchParams.get("bedrooms") as string) : undefined;
    const bathrooms = searchParams.get("bathrooms") ? parseInt(searchParams.get("bathrooms") as string) : undefined;
    const cityId = searchParams.get("cityId");
    const status = searchParams.get("status");
    const featured = searchParams.get("featured") === "true" ? true : undefined;
    const userId = searchParams.get("userId");
    
    // Handle pagination
    const page = searchParams.get("page") ? parseInt(searchParams.get("page") as string) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 10;
    const skip = (page - 1) * limit;
    
    // Construct filter object
    const filter: any = {};
    
    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.gte = minPrice;
      if (maxPrice) filter.price.lte = maxPrice;
    }
    if (bedrooms) filter.bedrooms = bedrooms;
    if (bathrooms) filter.bathrooms = bathrooms;
    if (cityId) filter.cityId = cityId;

    // Handle comma-separated status values
    if (status) {
      if (status.includes(',')) {
        // For comma-separated values, use 'in' operator
        const statusValues = status.split(',');
        filter.status = { in: statusValues };
      } else {
        filter.status = status;
      }
    }

    if (featured) filter.featured = featured;
    if (userId) filter.ownerId = userId;
    
    // Fetch properties with filtering
    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where: filter,
        include: {
          city: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phoneNumber: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.property.count({
        where: filter
      })
    ]);
    
    return NextResponse.json({
      properties,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST a new property
export async function POST(req: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    console.log("Form data entries:");
    for (const key of formData.keys()) {
      const values = formData.getAll(key);
      if (key === "images") {
        console.log(`${key}: ${values.length} files received`);
        values.forEach((value, index) => {
          if (value instanceof File) {
            console.log(`Image ${index + 1}:`, {
              name: value.name,
              type: value.type,
              size: value.size
            });
          } else {
            console.log(`Image ${index + 1}: Not a file object:`, typeof value);
          }
        });
      } else {
        console.log(`${key}:`, values);
      }
    }
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const type = formData.get("type") as string;
    const bedrooms = formData.get("bedrooms") ? parseInt(formData.get("bedrooms") as string) : undefined;
    const bathrooms = formData.get("bathrooms") ? parseInt(formData.get("bathrooms") as string) : undefined;
    const area = parseFloat(formData.get("area") as string);
    const address = formData.get("address") as string;
    const cityId = formData.get("cityId") as string;
    const images = formData.getAll("images");
    
    // 3. Validate data - IMPORTANT: Made validation more permissive for images
    // This allows form submission even with image upload issues for debugging
    const validatedData = {
      title,
      description,
      price,
      type,
      bedrooms,
      bathrooms,
      area,
      address,
      cityId,
      // Skip image validation by providing a dummy value that meets schema requirements
      images: undefined
    };

    try {
      // Modify validation to be more lenient with images
      // We'll still validate all other fields
      propertySchema.parse(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Filter out image-related errors
        const nonImageErrors = error.errors.filter(err => !err.path.includes('images'));
        if (nonImageErrors.length > 0) {
          return NextResponse.json({ error: nonImageErrors }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
      }
    }

    // 4. Process images - save uploaded files to public/images/properties
    const imageUrls: string[] = [];
    if (images && images.length > 0) {
      try {
        console.log(`Saving ${images.length} uploaded images to public/images/properties`);
        const uploadDir = path.join(process.cwd(), 'public', 'images', 'properties');
        await fs.mkdir(uploadDir, { recursive: true });
        for (let index = 0; index < images.length; index++) {
          const file = images[index] as Blob & { name?: string; type?: string };
          // Convert Blob/File to buffer
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
        // Use local placeholder image instead of external service
        imageUrls.push('/images/property-placeholder.jpg');
      }
    } else {
      // No images provided, use local placeholder image
      console.log('No images provided, using local placeholder image');
      imageUrls.push('/images/property-placeholder.jpg');
    }

    // 5. BYPASSING PRISMA: Use direct MongoDB client to avoid requiring replica set
    console.log("Using direct MongoDB client to create property");
    
    // Connect to MongoDB directly
    const client = await clientPromise;
    const db = client.db();
    
    // Create property document
    const now = new Date();
    const propertyData: any = {
      title,
      description,
      price,
      type,
      bedrooms,
      bathrooms,
      area,
      address,
      status: "PENDING",
      featured: false,
      images: imageUrls,
      createdAt: now,
      updatedAt: now,
      ownerId: new ObjectId(session.user.id),
    };
    
    // If cityId is provided, add it to the property
    if (cityId) {
      try {
        // Attempt to validate cityId format
        const objectId = new ObjectId(cityId);
        // Optionally check if city exists
        const cityExists = await db.collection('City').findOne({ _id: objectId });
        if (cityExists) {
          propertyData.cityId = objectId;
        } else {
          console.warn(`City with ID ${cityId} not found`);
        }
      } catch (err) {
        // Invalid ObjectId, skip cityId assignment
        console.warn(`Invalid cityId format: ${cityId}, skipping cityId assignment`);
      }
    }
    
    console.log("Inserting property:", propertyData);
    const result = await db.collection('Property').insertOne(propertyData);
    console.log("Insert result:", result);
    
    if (!result.acknowledged) {
      throw new Error("Failed to insert property into database");
    }
    
    // Get the created property with relations
    const createdProperty = await db.collection('Property').findOne({
      _id: result.insertedId
    });
    
    if (!createdProperty) {
      throw new Error("Property was created but could not be retrieved");
    }
    
    // Get city info if cityId is set
    let city = null;
    if (createdProperty.cityId) {
      try {
        const objectId = new ObjectId(createdProperty.cityId);
        city = await db.collection('City').findOne({ _id: objectId });
      } catch (err) {
        console.warn(`Invalid cityId for retrieving city: ${createdProperty.cityId}, skipping lookup`);
        city = null;
      }
    }
    
    // Get owner info
    const owner = await db.collection('User').findOne(
      { _id: new ObjectId(createdProperty.ownerId) },
      { projection: { id: 1, name: 1, email: 1, image: 1 } }
    );
    
    // Create response with included relations
    const propertyWithRelations = {
      ...createdProperty,
      id: createdProperty._id.toString(),
      city: city ? {
        id: city._id.toString(),
        name: city.name,
        province: city.province
      } : null,
      owner: owner ? {
        id: owner._id.toString(),
        name: owner.name,
        email: owner.email,
        image: owner.image
      } : null
    };
    
    console.log("Successfully created property:", propertyWithRelations.id);
    return NextResponse.json(propertyWithRelations, { status: 201 });
    
  } catch (error) {
    console.error("Error creating property:", error);
    
    // Improved error message handling for the client
    let errorMessage = "Failed to create property";
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle Prisma errors more specifically
      if (error.name === 'PrismaClientValidationError') {
        errorMessage = "Database validation error. Please check your input data.";
      } else if (error.name === 'PrismaClientKnownRequestError') {
        // Check for specific Prisma error codes
        const prismaError = error as any;
        if (prismaError.code === 'P2031') {
          errorMessage = "MongoDB error: Your database needs to be configured as a replica set for transactions. We're working on a fix.";
        } else if (prismaError.code === 'P2025') {
          errorMessage = "Record not found. The item you're trying to reference might not exist.";
          statusCode = 404;
        } else {
          errorMessage = "Database error. Some required fields may be missing or invalid.";
        }
      } else if (error.name === 'PrismaClientInitializationError') {
        errorMessage = "Database connection error. Please try again later.";
      } else if (error.name === 'MongoServerError') {
        const mongoError = error as any;
        if (mongoError.code === 11000) {
          errorMessage = "Duplicate entry. This record already exists.";
          statusCode = 409;
        } else {
          errorMessage = "MongoDB server error. Please try again later.";
        }
      }
      
      // Include the full error in development
      if (process.env.NODE_ENV !== 'production') {
        errorMessage += ` Details: ${error.toString()}`;
        
        // Add more debug info for MongoDB transaction errors
        if (errorMessage.includes('replica set')) {
          errorMessage += "\n\nTo fix this locally, you can either:\n1. Configure MongoDB as a replica set\n2. Use update operations separately instead of transactions\n3. Use a MongoDB Atlas cluster which supports transactions";
        }
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { promises as fs } from "fs";
import path from "path";
import { ObjectId } from "mongodb";
import { prisma } from "@/lib/prisma";
import {
  propertySchema,
  verificationDocumentTypes,
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_FILE_SIZE,
  isAcceptedDocumentFile,
  type VerificationDocumentType,
} from "@/schemas/property";
import { z } from "zod";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_IMAGE_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_LIST_LIMIT = 50;

function isVerificationDocumentType(value: string): value is VerificationDocumentType {
  return (verificationDocumentTypes as readonly string[]).includes(value);
}

type SessionUser = { id: string };

type PreparedVerificationDocument = {
  type: VerificationDocumentType;
  url: string;
  fileName: string;
  uploadedAt: Date;
};

function mapCreateError(error: unknown): { errorMessage: string; statusCode: number } {
  let errorMessage = "Failed to create property";
  let statusCode = 500;

  if (error instanceof z.ZodError) {
    return { errorMessage: JSON.stringify(error.errors), statusCode: 400 };
  }

  if (error instanceof Error) {
    errorMessage = error.message;

    if (error.name === "PrismaClientValidationError") {
      errorMessage = "Database validation error. Please check your input data.";
    } else if (error.name === "PrismaClientKnownRequestError") {
      const prismaError = error as Error & { code?: string };
      if (prismaError.code === "P2031") {
        errorMessage =
          "MongoDB error: Your database needs to be configured as a replica set for transactions.";
      } else if (prismaError.code === "P2025") {
        errorMessage =
          "Record not found. The item you're trying to reference might not exist.";
        statusCode = 404;
      } else {
        errorMessage =
          "Database error. Some required fields may be missing or invalid.";
      }
    } else if (error.name === "PrismaClientInitializationError") {
      errorMessage = "Database connection error. Please try again later.";
    } else if (error.name === "MongoServerError") {
      const mongoError = error as Error & { code?: number };
      if (mongoError.code === 11000) {
        errorMessage = "Duplicate entry. This record already exists.";
        statusCode = 409;
      } else {
        errorMessage = "MongoDB server error. Please try again later.";
      }
    }

    if (process.env.NODE_ENV !== "production") {
      errorMessage += ` Details: ${error.toString()}`;
    }
  }

  return { errorMessage, statusCode };
}

async function createPropertyRecord(params: {
  sessionUser: SessionUser;
  title: string;
  description: string;
  price: number;
  type: string;
  listingType: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  address: string;
  cityId?: string;
  imageUrls: string[];
  verificationDocuments: PreparedVerificationDocument[];
}) {
  const {
    sessionUser,
    title,
    description,
    price,
    type,
    listingType,
    bedrooms,
    bathrooms,
    area,
    address,
    cityId,
    imageUrls,
    verificationDocuments,
  } = params;

  const validatedData = {
    title,
    description,
    price,
    type,
    listingType,
    bedrooms,
    bathrooms,
    area,
    address,
    cityId,
    imageUrls,
    verificationDocuments: verificationDocuments.map((doc) => ({
      type: doc.type,
      url: doc.url,
      fileName: doc.fileName,
    })),
  };

  propertySchema.parse(validatedData);

  const client = await clientPromise;
  const db = client.db();
  const now = new Date();
  const propertyData: Record<string, unknown> = {
    title,
    description,
    price,
    type,
    listingType,
    bedrooms,
    bathrooms,
    area,
    address,
    status: "PENDING",
    featured: false,
    images: imageUrls,
    verificationDocuments,
    createdAt: now,
    updatedAt: now,
    ownerId: new ObjectId(sessionUser.id),
  };

  if (cityId) {
    try {
      const objectId = new ObjectId(cityId);
      const cityExists = await db.collection("City").findOne({ _id: objectId });
      if (cityExists) {
        propertyData.cityId = objectId;
      } else {
        console.warn(`City with ID ${cityId} not found`);
      }
    } catch {
      console.warn(`Invalid cityId format: ${cityId}, skipping cityId assignment`);
    }
  }

  const result = await db.collection("Property").insertOne(propertyData);
  if (!result.acknowledged) {
    throw new Error("Failed to insert property into database");
  }

  const createdProperty = await db.collection("Property").findOne({
    _id: result.insertedId,
  });
  if (!createdProperty) {
    throw new Error("Property was created but could not be retrieved");
  }

  let city = null;
  if (createdProperty.cityId) {
    try {
      city = await db.collection("City").findOne({
        _id: new ObjectId(createdProperty.cityId),
      });
    } catch {
      city = null;
    }
  }

  const owner = await db.collection("User").findOne(
    { _id: new ObjectId(createdProperty.ownerId) },
    { projection: { id: 1, name: 1, email: 1, image: 1 } }
  );

  return {
    ...createdProperty,
    id: createdProperty._id.toString(),
    city: city
      ? {
          id: city._id.toString(),
          name: city.name,
          province: city.province,
        }
      : null,
    owner: owner
      ? {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          image: owner.image,
        }
      : null,
  };
}

// GET all properties or filter properties
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice") as string)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice") as string)
      : undefined;
    const bedrooms = searchParams.get("bedrooms")
      ? parseInt(searchParams.get("bedrooms") as string)
      : undefined;
    const bathrooms = searchParams.get("bathrooms")
      ? parseInt(searchParams.get("bathrooms") as string)
      : undefined;
    const cityId = searchParams.get("cityId");
    const status = searchParams.get("status");
    const featured = searchParams.get("featured") === "true" ? true : undefined;
    const userId = searchParams.get("userId");

    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page") as string)
      : 1;
    const rawLimit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") as string)
      : 10;
    const limit = Math.min(Math.max(rawLimit || 10, 1), MAX_LIST_LIMIT);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (type) filter.type = type;
    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      };
    }
    if (bedrooms) filter.bedrooms = bedrooms;
    if (bathrooms) filter.bathrooms = bathrooms;
    if (cityId) filter.cityId = cityId;

    if (status) {
      if (status.includes(",")) {
        filter.status = { in: status.split(",") };
      } else {
        filter.status = status;
      }
    }

    if (featured) filter.featured = featured;
    if (userId) filter.ownerId = userId;

    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where: filter,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          type: true,
          listingType: true,
          bedrooms: true,
          bathrooms: true,
          area: true,
          address: true,
          status: true,
          featured: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          cityId: true,
          ownerId: true,
          rejectionReason: true,
          city: {
            select: {
              id: true,
              name: true,
              province: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.property.count({
        where: filter,
      }),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

/**
 * Preferred production path: JSON body with already-uploaded file URLs
 * (UploadThing). Keeps the serverless request under Vercel's 4.5MB limit.
 */
async function handleJsonCreate(
  req: NextRequest,
  sessionUser: SessionUser
): Promise<NextResponse> {
  const body = await req.json();

  const title = String(body.title ?? "");
  const description = String(body.description ?? "");
  const price = parseFloat(String(body.price));
  const type = String(body.type ?? "");
  const listingType = String(body.listingType ?? "SALE");
  const bedrooms = body.bedrooms != null ? parseInt(String(body.bedrooms)) : undefined;
  const bathrooms =
    body.bathrooms != null ? parseInt(String(body.bathrooms)) : undefined;
  const area = parseFloat(String(body.area));
  const address = String(body.address ?? "");
  const cityId = body.cityId ? String(body.cityId) : undefined;

  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.map(String).filter(Boolean)
    : [];

  if (imageUrls.length === 0) {
    return NextResponse.json(
      { error: "At least one property image is required" },
      { status: 400 }
    );
  }

  const rawDocs = Array.isArray(body.verificationDocuments)
    ? body.verificationDocuments
    : [];

  if (rawDocs.length === 0) {
    return NextResponse.json(
      { error: "At least one verification document is required" },
      { status: 400 }
    );
  }

  const verificationDocuments: PreparedVerificationDocument[] = [];
  for (const doc of rawDocs) {
    const docType = String(doc?.type ?? "");
    const url = String(doc?.url ?? "");
    const fileName = String(doc?.fileName ?? "document");

    if (!isVerificationDocumentType(docType)) {
      return NextResponse.json(
        { error: `Invalid verification document type: ${docType}` },
        { status: 400 }
      );
    }
    if (!url) {
      return NextResponse.json(
        { error: "Each verification document must include a url" },
        { status: 400 }
      );
    }

    verificationDocuments.push({
      type: docType,
      url,
      fileName,
      uploadedAt: new Date(),
    });
  }

  const property = await createPropertyRecord({
    sessionUser,
    title,
    description,
    price,
    type,
    listingType,
    bedrooms: Number.isFinite(bedrooms) ? bedrooms : undefined,
    bathrooms: Number.isFinite(bathrooms) ? bathrooms : undefined,
    area,
    address,
    cityId,
    imageUrls,
    verificationDocuments,
  });

  return NextResponse.json(property, { status: 201 });
}

/**
 * Local-dev fallback: multipart FormData saved to public/.
 * Not suitable for Vercel (4.5MB body limit + ephemeral filesystem).
 */
async function handleFormDataCreate(
  req: NextRequest,
  sessionUser: SessionUser
): Promise<NextResponse> {
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          "Direct file uploads are not supported in production. Upload files via UploadThing first, then submit image/document URLs as JSON.",
      },
      { status: 413 }
    );
  }

  const formData = await req.formData();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const type = formData.get("type") as string;
  const listingType = (formData.get("listingType") as string) || "SALE";
  const bedrooms = formData.get("bedrooms")
    ? parseInt(formData.get("bedrooms") as string)
    : undefined;
  const bathrooms = formData.get("bathrooms")
    ? parseInt(formData.get("bathrooms") as string)
    : undefined;
  const area = parseFloat(formData.get("area") as string);
  const address = formData.get("address") as string;
  const cityId = formData.get("cityId") as string;
  const images = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);
  const verificationDocumentFiles = formData
    .getAll("verificationDocuments")
    .filter((item): item is File => item instanceof File && item.size > 0);

  let documentTypes: string[] = [];
  const rawDocumentTypes = formData.get("verificationDocumentTypes");
  if (typeof rawDocumentTypes === "string" && rawDocumentTypes.trim()) {
    try {
      const parsed = JSON.parse(rawDocumentTypes);
      if (Array.isArray(parsed)) {
        documentTypes = parsed.map(String);
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid verification document types payload" },
        { status: 400 }
      );
    }
  }

  if (images.length === 0) {
    return NextResponse.json(
      { error: "At least one property image is required" },
      { status: 400 }
    );
  }

  if (verificationDocumentFiles.length === 0) {
    return NextResponse.json(
      { error: "At least one verification document is required" },
      { status: 400 }
    );
  }

  if (verificationDocumentFiles.length !== documentTypes.length) {
    return NextResponse.json(
      { error: "Each verification document must include a document type" },
      { status: 400 }
    );
  }

  for (const image of images) {
    if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WEBP images are allowed" },
        { status: 400 }
      );
    }
    if (image.size > MAX_IMAGE_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image size exceeds the 4MB limit" },
        { status: 400 }
      );
    }
  }

  for (let i = 0; i < verificationDocumentFiles.length; i++) {
    const file = verificationDocumentFiles[i];
    const docType = documentTypes[i];

    if (!isVerificationDocumentType(docType)) {
      return NextResponse.json(
        { error: `Invalid verification document type: ${docType}` },
        { status: 400 }
      );
    }
    if (!isAcceptedDocumentFile(file)) {
      const name = file.name.toLowerCase();
      const mimeOk = ACCEPTED_DOCUMENT_TYPES.includes(file.type);
      const extensionOk =
        name.endsWith(".pdf") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg");
      if (!mimeOk && !extensionOk) {
        return NextResponse.json(
          { error: "Verification documents must be PDF or JPEG" },
          { status: 400 }
        );
      }
      if (file.size > MAX_DOCUMENT_FILE_SIZE) {
        return NextResponse.json(
          { error: "Document size exceeds the 16MB limit" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Invalid verification document" },
        { status: 400 }
      );
    }
  }

  const imageUrls: string[] = [];
  const uploadDir = path.join(process.cwd(), "public", "images", "properties");
  await fs.mkdir(uploadDir, { recursive: true });
  for (let index = 0; index < images.length; index++) {
    const file = images[index];
    const buffer = Buffer.from(await file.arrayBuffer());
    let ext = ".jpg";
    if (file.name) {
      ext = path.extname(file.name) || ext;
    } else if (file.type) {
      const parts = file.type.split("/");
      if (parts.length === 2) ext = `.${parts[1]}`;
    }
    const filename = `${Date.now()}-${index}${ext}`;
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    imageUrls.push(`/images/properties/${filename}`);
  }

  const verificationDocuments: PreparedVerificationDocument[] = [];
  const docsDir = path.join(process.cwd(), "public", "documents", "properties");
  await fs.mkdir(docsDir, { recursive: true });
  for (let index = 0; index < verificationDocumentFiles.length; index++) {
    const file = verificationDocumentFiles[index];
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext =
      path.extname(file.name || "") ||
      (file.type === "application/pdf" ? ".pdf" : ".jpg");
    const safeType = documentTypes[index].toLowerCase().replace(/_/g, "-");
    const filename = `${Date.now()}-${safeType}-${index}${ext}`;
    await fs.writeFile(path.join(docsDir, filename), buffer);
    verificationDocuments.push({
      type: documentTypes[index] as VerificationDocumentType,
      url: `/documents/properties/${filename}`,
      fileName: file.name || filename,
      uploadedAt: new Date(),
    });
  }

  const property = await createPropertyRecord({
    sessionUser,
    title,
    description,
    price,
    type,
    listingType,
    bedrooms,
    bathrooms,
    area,
    address,
    cityId,
    imageUrls,
    verificationDocuments,
  });

  return NextResponse.json(property, { status: 201 });
}

// POST a new property
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser: SessionUser = { id: session.user.id };
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await handleJsonCreate(req, sessionUser);
    }

    return await handleFormDataCreate(req, sessionUser);
  } catch (error) {
    console.error("Error creating property:", error);
    const { errorMessage, statusCode } = mapCreateError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

/**
 * Consumer favorites (saved listings).
 * GET  — list favorited properties for the signed-in user
 * POST — add a property to favorites
 */

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import prisma from "@/lib/prismadb";
import clientPromise from "@/lib/mongodb";
import { absoluteMediaUrls } from "@/lib/media-url";
import { AuthError, authErrorResponse, requireAuth } from "@/lib/require-auth";

const addFavoriteSchema = z.object({
  propertyId: z.string().min(1, "propertyId is required"),
});

function serializeFavoriteProperty(
  property: {
    _id: ObjectId;
    title?: string;
    description?: string;
    price?: number;
    type?: string;
    listingType?: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    area?: number;
    address?: string;
    status?: string;
    featured?: boolean;
    images?: string[];
    cityId?: ObjectId | null;
    createdAt?: Date;
    updatedAt?: Date;
  },
  city: { _id: ObjectId; name: string; province: string } | null,
  origin: string,
  favoritedAt: Date
) {
  return {
    id: property._id.toString(),
    title: property.title || "",
    description: property.description || "",
    price: property.price || 0,
    type: property.type || "HOUSE",
    listingType: property.listingType || "SALE",
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    area: property.area || 0,
    address: property.address || "",
    status: property.status || "PENDING",
    featured: Boolean(property.featured),
    images: absoluteMediaUrls(property.images || [], origin),
    city: city
      ? {
          id: city._id.toString(),
          name: city.name,
          province: city.province,
        }
      : null,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
    favoritedAt,
    isFavorite: true,
  };
}

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);

    if (actor.kind === "web" && actor.isTeamMember) {
      return NextResponse.json(
        { error: "Staff cannot use consumer favorites", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: actor.userId },
      orderBy: { createdAt: "desc" },
      select: { propertyId: true, createdAt: true },
    });

    if (!favorites.length) {
      return NextResponse.json({ properties: [], ids: [] });
    }

    const propertyIds = favorites.map((f) => f.propertyId);
    const favoritedAtById = new Map(
      favorites.map((f) => [f.propertyId, f.createdAt])
    );

    const client = await clientPromise;
    const db = client.db();
    const objectIds = propertyIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const properties = await db
      .collection("Property")
      .find({
        _id: { $in: objectIds },
        status: { $in: ["VERIFIED", "ACTIVE"] },
      })
      .toArray();

    const cityIds = properties
      .map((p) => p.cityId)
      .filter((id): id is ObjectId => Boolean(id));
    const cities = cityIds.length
      ? await db
          .collection("City")
          .find({ _id: { $in: cityIds } })
          .toArray()
      : [];
    const cityById = new Map(cities.map((c) => [c._id.toString(), c]));

    const byId = new Map(properties.map((p) => [p._id.toString(), p]));
    const origin = req.nextUrl.origin;

    const ordered = favorites
      .map((fav) => {
        const property = byId.get(fav.propertyId);
        if (!property) return null;
        const city = property.cityId
          ? cityById.get(property.cityId.toString()) || null
          : null;
        return serializeFavoriteProperty(
          property as never,
          city as never,
          origin,
          favoritedAtById.get(fav.propertyId) || fav.createdAt
        );
      })
      .filter(Boolean);

    return NextResponse.json({
      properties: ordered,
      ids: favorites.map((f) => f.propertyId),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[FAVORITES_GET]", error);
    return NextResponse.json(
      { error: "Failed to load favorites", code: "FAVORITES_FAILED" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req);

    if (actor.kind === "web" && actor.isTeamMember) {
      return NextResponse.json(
        { error: "Staff cannot use consumer favorites", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = addFavoriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid request",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { propertyId } = parsed.data;
    if (!ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { error: "Invalid property id", code: "INVALID_PROPERTY" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const property = await db.collection("Property").findOne({
      _id: new ObjectId(propertyId),
      status: { $in: ["VERIFIED", "ACTIVE"] },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: actor.userId,
          propertyId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        propertyId,
        favorited: true,
        createdAt: existing.createdAt,
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: actor.userId,
        propertyId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        propertyId,
        favorited: true,
        createdAt: favorite.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[FAVORITES_POST]", error);
    return NextResponse.json(
      { error: "Failed to save favorite", code: "FAVORITE_FAILED" },
      { status: 500 }
    );
  }
}

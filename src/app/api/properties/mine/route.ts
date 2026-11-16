/**
 * Authenticated "my listings" endpoint.
 * Replaces the insecure public `GET /api/properties?userId=` filter.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteMediaUrls } from "@/lib/media-url";
import { AuthError, authErrorResponse, requireAuth } from "@/lib/require-auth";

const MAX_LIST_LIMIT = 50;

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(rawLimit || 20, 1), MAX_LIST_LIMIT);
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      ownerId: actor.userId,
    };

    if (status) {
      where.status = status.includes(",")
        ? { in: status.split(",").map((s) => s.trim()).filter(Boolean) }
        : status;
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
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
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
          city: {
            select: { id: true, name: true, province: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    const origin = req.nextUrl.origin;

    return NextResponse.json({
      properties: properties.map((property) => ({
        ...property,
        images: absoluteMediaUrls(property.images, origin),
      })),
      pagination: {
        total,
        pages: Math.ceil(total / limit) || 0,
        page,
        limit,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[PROPERTIES_MINE]", error);
    return NextResponse.json(
      { error: "Failed to fetch listings", code: "MINE_FAILED" },
      { status: 500 }
    );
  }
}

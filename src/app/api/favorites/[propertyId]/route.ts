/**
 * DELETE /api/favorites/:propertyId — remove a saved listing.
 * GET    /api/favorites/:propertyId — whether the current user favorited it.
 */

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import prisma from "@/lib/prismadb";
import { AuthError, authErrorResponse, requireAuth } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ propertyId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const actor = await requireAuth(req);
    const { propertyId } = await context.params;

    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { error: "Invalid property id", code: "INVALID_PROPERTY" },
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: actor.userId,
          propertyId,
        },
      },
      select: { createdAt: true },
    });

    return NextResponse.json({
      propertyId,
      favorited: Boolean(favorite),
      createdAt: favorite?.createdAt ?? null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[FAVORITE_GET]", error);
    return NextResponse.json(
      { error: "Failed to check favorite", code: "FAVORITE_FAILED" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const actor = await requireAuth(req);
    const { propertyId } = await context.params;

    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { error: "Invalid property id", code: "INVALID_PROPERTY" },
        { status: 400 }
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: actor.userId,
        propertyId,
      },
    });

    return NextResponse.json({
      success: true,
      propertyId,
      favorited: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[FAVORITE_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to remove favorite", code: "FAVORITE_FAILED" },
      { status: 500 }
    );
  }
}

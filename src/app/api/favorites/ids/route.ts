/**
 * Lightweight list of favorited property ids for the signed-in user.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { AuthError, authErrorResponse, requireAuth } from "@/lib/require-auth";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);

    if (actor.kind === "web" && actor.isTeamMember) {
      return NextResponse.json({ ids: [] });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: actor.userId },
      select: { propertyId: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ids: favorites.map((f) => f.propertyId),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[FAVORITE_IDS]", error);
    return NextResponse.json(
      { error: "Failed to load favorite ids", code: "FAVORITES_FAILED" },
      { status: 500 }
    );
  }
}

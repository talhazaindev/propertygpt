/**
 * List a user's posted properties for the new-conversation subject dropdown.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { resolveMessagingActor } from "@/lib/messaging-auth";

export async function GET(req: Request) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let ownerId: string;

    if (actor.kind === "user") {
      ownerId = actor.userId;
    } else {
      if (!actor.canAccessInbox) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const requestedUserId = searchParams.get("userId");
      if (!requestedUserId) {
        return NextResponse.json(
          { error: "userId is required for staff" },
          { status: 400 }
        );
      }
      ownerId = requestedUserId;
    }

    const properties = await prisma.property.findMany({
      where: { ownerId },
      select: {
        id: true,
        title: true,
        status: true,
        listingType: true,
        address: true,
        city: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      properties: properties.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        listingType: p.listingType,
        label: [
          p.title,
          p.city?.name,
          p.status,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    });
  } catch (error) {
    console.error("[MESSAGES_USER_PROPERTIES]", error);
    return NextResponse.json(
      { error: "Failed to load properties" },
      { status: 500 }
    );
  }
}

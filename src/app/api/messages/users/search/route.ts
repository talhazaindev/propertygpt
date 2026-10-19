/**
 * Staff search for users when starting a conversation.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { resolveMessagingActor } from "@/lib/messaging-auth";

export async function GET(req: Request) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor || actor.kind !== "staff" || !actor.canAccessInbox) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q } },
          { name: { contains: q } },
        ],
      },
      select: { id: true, name: true, email: true, role: true },
      take: 15,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[MESSAGES_USER_SEARCH]", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}

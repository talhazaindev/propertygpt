/**
 * Get a single conversation with messages.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { resolveMessagingActor } from "@/lib/messaging-auth";
import {
  serializeConversation,
  serializeMessage,
} from "@/lib/messaging-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 200,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (actor.kind === "user") {
      if (conversation.userId !== actor.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      if (!actor.canAccessInbox) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (
        actor.teamMember.role === "CUSTOMER_SUPPORT" &&
        conversation.assignedToId &&
        conversation.assignedToId !== actor.teamMember.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      conversation: serializeConversation(conversation),
      messages: conversation.messages.map(serializeMessage),
    });
  } catch (error) {
    console.error("[MESSAGES_CONVERSATION_GET]", error);
    return NextResponse.json(
      { error: "Failed to load conversation" },
      { status: 500 }
    );
  }
}

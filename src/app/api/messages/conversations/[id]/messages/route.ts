/**
 * Send a message in a conversation.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prismadb";
import { resolveMessagingActor } from "@/lib/messaging-auth";
import {
  sendMessage,
  serializeConversation,
  serializeMessage,
} from "@/lib/messaging-service";

const sendSchema = z.object({
  body: z.string().max(10000).optional().default(""),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string(),
        type: z.string(),
        size: z.number().optional(),
      })
    )
    .optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
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
    }

    const payload = sendSchema.parse(await req.json());
    const { conversation: updated, message } = await sendMessage({
      conversationId: id,
      senderType: actor.kind === "user" ? "USER" : "STAFF",
      senderUserId: actor.kind === "user" ? actor.userId : null,
      senderTeamId: actor.kind === "staff" ? actor.teamMember.id : null,
      body: payload.body,
      attachments: payload.attachments,
    });

    const full = await prisma.conversation.findUnique({
      where: { id: updated.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({
      conversation: serializeConversation(full!),
      message: serializeMessage(message),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[MESSAGES_SEND]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send message",
      },
      { status: 500 }
    );
  }
}

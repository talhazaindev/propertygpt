/**
 * Mark a conversation as read for the current actor.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { resolveMessagingActor } from "@/lib/messaging-auth";
import { serializeConversation } from "@/lib/messaging-service";
import { emitMessagingEvent } from "@/lib/messaging-ws-emit";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
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
      const updated = await prisma.conversation.update({
        where: { id },
        data: { userUnreadCount: 0 },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
      await prisma.message.updateMany({
        where: {
          conversationId: id,
          senderType: "STAFF",
          readAt: null,
        },
        data: { readAt: new Date() },
      });
      const serialized = serializeConversation(updated);
      await emitMessagingEvent("conversation:read", {
        conversationId: id,
        userId: updated.userId,
        assignedToId: updated.assignedToId,
        by: "user",
      });
      return NextResponse.json({ conversation: serialized });
    }

    if (!actor.canAccessInbox) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { staffUnreadCount: 0 },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderType: "USER",
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    const serialized = serializeConversation(updated);
    await emitMessagingEvent("conversation:read", {
      conversationId: id,
      userId: updated.userId,
      assignedToId: updated.assignedToId,
      by: "staff",
    });
    return NextResponse.json({ conversation: serialized });
  } catch (error) {
    console.error("[MESSAGES_READ]", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}

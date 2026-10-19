/**
 * Assign / reassign a conversation to a CUSTOMER_SUPPORT agent.
 * SUPER_ADMIN and CUSTOMER_SUPPORT with inbox access can reassign.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prismadb";
import { resolveMessagingActor } from "@/lib/messaging-auth";
import { serializeConversation } from "@/lib/messaging-service";
import { emitMessagingEvent } from "@/lib/messaging-ws-emit";

const assignSchema = z.object({
  assignedToId: z.string().min(1),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor || actor.kind !== "staff" || !actor.canAccessInbox) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const { assignedToId } = assignSchema.parse(await req.json());

    const target = await prisma.teamMember.findUnique({
      where: { id: assignedToId },
    });
    if (
      !target ||
      !target.isActive ||
      (target.role !== "CUSTOMER_SUPPORT" && target.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json(
        { error: "Assignee must be an active CUSTOMER_SUPPORT or SUPER_ADMIN" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { assignedToId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    const serialized = serializeConversation(conversation);
    await emitMessagingEvent("conversation:assigned", {
      conversationId: conversation.id,
      userId: conversation.userId,
      assignedToId: conversation.assignedToId,
      conversation: serialized,
    });

    return NextResponse.json({ conversation: serialized });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[MESSAGES_ASSIGN]", error);
    return NextResponse.json(
      { error: "Failed to assign conversation" },
      { status: 500 }
    );
  }
}

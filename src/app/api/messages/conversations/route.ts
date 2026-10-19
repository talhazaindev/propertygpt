/**
 * List and create support conversations.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prismadb";
import {
  buildSubjectKey,
  resolveMessagingActor,
} from "@/lib/messaging-auth";
import {
  createOrGetConversation,
  sendMessage,
  serializeConversation,
} from "@/lib/messaging-service";
import { pickLeastBusySupportAgent } from "@/lib/messaging-assign";

const createSchema = z.object({
  subjectType: z.enum([
    "PROPERTY",
    "PROPERTY_REQUEST",
    "AGENT_REQUEST",
    "GENERAL",
  ]),
  subjectId: z.string().optional().nullable(),
  body: z.string().min(1).max(10000),
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
  /** Staff starting a thread with a user */
  userId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (actor.kind === "user") {
      const conversations = await prisma.conversation.findMany({
        where: { userId: actor.userId },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      });
      return NextResponse.json({
        conversations: conversations.map(serializeConversation),
      });
    }

    if (!actor.canAccessInbox) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all"; // all | mine | unassigned

    const where: Record<string, unknown> = {};
    if (filter === "mine") {
      where.assignedToId = actor.teamMember.id;
    } else if (filter === "unassigned") {
      where.assignedToId = null;
    } else if (actor.teamMember.role === "CUSTOMER_SUPPORT") {
      // Support sees unassigned + own by default when filter=all
      where.OR = [
        { assignedToId: null },
        { assignedToId: actor.teamMember.id },
      ];
    }
    // SUPER_ADMIN with filter=all sees everything

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      conversations: conversations.map(serializeConversation),
    });
  } catch (error) {
    console.error("[MESSAGES_CONVERSATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createSchema.parse(await req.json());
    const subjectKey = buildSubjectKey(body.subjectType, body.subjectId);

    let userId: string;
    if (actor.kind === "user") {
      userId = actor.userId;
    } else {
      if (!actor.canAccessInbox) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!body.userId) {
        return NextResponse.json(
          { error: "userId is required when staff starts a conversation" },
          { status: 400 }
        );
      }
      userId = body.userId;
    }

    let conversation = await createOrGetConversation({
      userId,
      subjectType: body.subjectType,
      subjectId: body.subjectId,
      subjectKey,
    });

    // Staff-initiated: assign to self (or least busy if super admin prefers auto)
    if (actor.kind === "staff" && !conversation.assignedToId) {
      const assignTo =
        actor.teamMember.role === "CUSTOMER_SUPPORT"
          ? actor.teamMember.id
          : (await pickLeastBusySupportAgent()) || actor.teamMember.id;
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { assignedToId: assignTo },
      });
    }

    const { conversation: updated, message } = await sendMessage({
      conversationId: conversation.id,
      senderType: actor.kind === "user" ? "USER" : "STAFF",
      senderUserId: actor.kind === "user" ? actor.userId : null,
      senderTeamId: actor.kind === "staff" ? actor.teamMember.id : null,
      body: body.body,
      attachments: body.attachments,
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
      message: {
        id: message.id,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[MESSAGES_CONVERSATIONS_POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create conversation" },
      { status: 500 }
    );
  }
}

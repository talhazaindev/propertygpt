/**
 * Shared messaging operations: create/send, notify, serialize for clients.
 */

import prisma from "@/lib/prismadb";
import {
  decryptText,
  encryptText,
  previewText,
} from "@/lib/message-crypto";
import { ensureConversationAssigned } from "@/lib/messaging-assign";
import { emitMessagingEvent } from "@/lib/messaging-ws-emit";
import { sendNewMessageEmail } from "@/lib/email";
import type {
  Conversation,
  ConversationSubjectType,
  Message,
  MessageSenderType,
} from "@prisma/client";

export type MessageAttachment = {
  url: string;
  name: string;
  type: string;
  size?: number;
};

export function serializeMessage(message: Message) {
  let body = "";
  try {
    body = decryptText(message.bodyCiphertext, message.bodyIv);
  } catch {
    body = "[Unable to decrypt message]";
  }
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderType: message.senderType,
    senderUserId: message.senderUserId,
    senderTeamId: message.senderTeamId,
    body,
    attachments: (message.attachments || []) as MessageAttachment[],
    createdAt: message.createdAt,
    readAt: message.readAt,
  };
}

export function serializeConversation(
  conversation: Conversation & {
    assignedTo?: { id: string; name: string; email: string; role: string } | null;
    user?: { id: string; name: string | null; email: string } | null;
  }
) {
  let lastPreview: string | null = null;
  if (conversation.lastPreviewCipher && conversation.lastPreviewIv) {
    try {
      lastPreview = decryptText(
        conversation.lastPreviewCipher,
        conversation.lastPreviewIv
      );
    } catch {
      lastPreview = null;
    }
  }
  return {
    id: conversation.id,
    subjectType: conversation.subjectType,
    subjectKey: conversation.subjectKey,
    subjectId: conversation.subjectId,
    subjectLabel: conversation.subjectLabel,
    status: conversation.status,
    userId: conversation.userId,
    user: conversation.user || null,
    assignedToId: conversation.assignedToId,
    assignedTo: conversation.assignedTo || null,
    lastMessageAt: conversation.lastMessageAt,
    lastPreview,
    userUnreadCount: conversation.userUnreadCount,
    staffUnreadCount: conversation.staffUnreadCount,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

async function resolveSubjectLabel(
  subjectType: ConversationSubjectType,
  subjectId?: string | null
): Promise<string> {
  if (subjectType === "GENERAL" || !subjectId) {
    return "General support";
  }
  if (subjectType === "PROPERTY") {
    const property = await prisma.property.findUnique({
      where: { id: subjectId },
      select: { title: true },
    });
    return property?.title || "Property";
  }
  if (subjectType === "PROPERTY_REQUEST") {
    const request = await prisma.propertyRequest.findUnique({
      where: { id: subjectId },
      select: { name: true, city: true, propertyType: true },
    });
    if (!request) return "Property request";
    return `Request: ${request.propertyType} in ${request.city}`;
  }
  if (subjectType === "AGENT_REQUEST") {
    const request = await prisma.agentRequest.findUnique({
      where: { id: subjectId },
      select: { title: true },
    });
    return request?.title || "Agent request";
  }
  return "Support";
}

export async function createOrGetConversation(params: {
  userId: string;
  subjectType: ConversationSubjectType;
  subjectId?: string | null;
  subjectKey: string;
}): Promise<Conversation> {
  const existing = await prisma.conversation.findUnique({
    where: {
      userId_subjectKey: {
        userId: params.userId,
        subjectKey: params.subjectKey,
      },
    },
  });
  if (existing) return existing;

  const subjectLabel = await resolveSubjectLabel(
    params.subjectType,
    params.subjectId
  );

  return prisma.conversation.create({
    data: {
      userId: params.userId,
      subjectType: params.subjectType,
      subjectKey: params.subjectKey,
      subjectId:
        params.subjectType === "GENERAL" ? null : params.subjectId || null,
      subjectLabel,
      status: "OPEN",
    },
  });
}

async function notifyRecipients(params: {
  conversation: Conversation;
  senderType: MessageSenderType;
}): Promise<void> {
  const { conversation, senderType } = params;
  const label = conversation.subjectLabel;

  if (senderType === "STAFF") {
    const user = await prisma.user.findUnique({
      where: { id: conversation.userId },
      select: { email: true, name: true },
    });
    if (user?.email) {
      await sendNewMessageEmail({
        to: user.email,
        recipientName: user.name,
        inboxPath: `/inbox?c=${conversation.id}`,
        subjectLabel: label,
      });
    }
    return;
  }

  // User sent → notify assigned agent, or all CUSTOMER_SUPPORT if unassigned
  if (conversation.assignedToId) {
    const agent = await prisma.teamMember.findUnique({
      where: { id: conversation.assignedToId },
      select: { email: true, name: true, isActive: true },
    });
    if (agent?.isActive && agent.email) {
      await sendNewMessageEmail({
        to: agent.email,
        recipientName: agent.name,
        inboxPath: `/admin/messages?c=${conversation.id}`,
        subjectLabel: label,
      });
    }
    return;
  }

  const supportTeam = await prisma.teamMember.findMany({
    where: { role: "CUSTOMER_SUPPORT", isActive: true },
    select: { email: true, name: true },
  });
  await Promise.all(
    supportTeam.map((member) =>
      sendNewMessageEmail({
        to: member.email,
        recipientName: member.name,
        inboxPath: `/admin/messages?c=${conversation.id}`,
        subjectLabel: label,
      })
    )
  );
}

export async function sendMessage(params: {
  conversationId: string;
  senderType: MessageSenderType;
  senderUserId?: string | null;
  senderTeamId?: string | null;
  body: string;
  attachments?: MessageAttachment[];
}): Promise<{ conversation: Conversation; message: Message }> {
  const body = params.body.trim();
  if (!body && (!params.attachments || params.attachments.length === 0)) {
    throw new Error("Message body or attachment is required");
  }

  let conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Auto-assign when user messages an unassigned thread
  if (params.senderType === "USER" && !conversation.assignedToId) {
    const assignedId = await ensureConversationAssigned(
      conversation.id,
      conversation.assignedToId
    );
    if (assignedId) {
      conversation = await prisma.conversation.findUniqueOrThrow({
        where: { id: conversation.id },
      });
    }
  }

  // Staff reply on unassigned thread → claim it
  if (
    params.senderType === "STAFF" &&
    !conversation.assignedToId &&
    params.senderTeamId
  ) {
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { assignedToId: params.senderTeamId },
    });
  }

  const encrypted = encryptText(body || "(attachment)");
  const preview = encryptText(previewText(body || "Sent an attachment"));

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: params.senderType,
      senderUserId: params.senderUserId || null,
      senderTeamId: params.senderTeamId || null,
      bodyCiphertext: encrypted.ciphertext,
      bodyIv: encrypted.iv,
      attachments: (params.attachments || []) as object[],
    },
  });

  const updated = await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: message.createdAt,
      lastPreviewCipher: preview.ciphertext,
      lastPreviewIv: preview.iv,
      status: "OPEN",
      ...(params.senderType === "USER"
        ? { staffUnreadCount: { increment: 1 }, userUnreadCount: 0 }
        : { userUnreadCount: { increment: 1 }, staffUnreadCount: 0 }),
    },
  });

  const serializedMessage = serializeMessage(message);
  await emitMessagingEvent("message:new", {
    conversationId: updated.id,
    userId: updated.userId,
    assignedToId: updated.assignedToId,
    message: serializedMessage,
    conversation: serializeConversation(updated),
  });

  // Fire-and-forget email (don't block response)
  void notifyRecipients({
    conversation: updated,
    senderType: params.senderType,
  }).catch((err) => console.error("[messaging] email notify failed", err));

  return { conversation: updated, message };
}

/**
 * Auto-assign conversations to CUSTOMER_SUPPORT with fewest open chats,
 * then fewest unread (staffUnreadCount).
 */

import prisma from "@/lib/prismadb";

export async function pickLeastBusySupportAgent(): Promise<string | null> {
  const agents = await prisma.teamMember.findMany({
    where: {
      role: "CUSTOMER_SUPPORT",
      isActive: true,
    },
    select: { id: true },
  });

  if (agents.length === 0) {
    return null;
  }

  const scored = await Promise.all(
    agents.map(async (agent) => {
      const openChats = await prisma.conversation.count({
        where: {
          assignedToId: agent.id,
          status: "OPEN",
        },
      });
      const unreadAgg = await prisma.conversation.aggregate({
        where: {
          assignedToId: agent.id,
          status: "OPEN",
        },
        _sum: { staffUnreadCount: true },
      });
      return {
        id: agent.id,
        openChats,
        unread: unreadAgg._sum.staffUnreadCount || 0,
      };
    })
  );

  scored.sort((a, b) => {
    if (a.openChats !== b.openChats) return a.openChats - b.openChats;
    return a.unread - b.unread;
  });

  return scored[0]?.id ?? null;
}

export async function ensureConversationAssigned(
  conversationId: string,
  currentAssignedToId: string | null
): Promise<string | null> {
  if (currentAssignedToId) {
    return currentAssignedToId;
  }
  const agentId = await pickLeastBusySupportAgent();
  if (!agentId) {
    return null;
  }
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { assignedToId: agentId },
  });
  return agentId;
}

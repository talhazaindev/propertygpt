/**
 * List CUSTOMER_SUPPORT (+ SUPER_ADMIN) agents for reassignment UI.
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

    const agents = await prisma.teamMember.findMany({
      where: {
        isActive: true,
        role: { in: ["CUSTOMER_SUPPORT", "SUPER_ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    const withLoad = await Promise.all(
      agents.map(async (agent) => {
        const openChats = await prisma.conversation.count({
          where: { assignedToId: agent.id, status: "OPEN" },
        });
        const unreadAgg = await prisma.conversation.aggregate({
          where: { assignedToId: agent.id, status: "OPEN" },
          _sum: { staffUnreadCount: true },
        });
        return {
          ...agent,
          openChats,
          unread: unreadAgg._sum.staffUnreadCount || 0,
        };
      })
    );

    return NextResponse.json({ agents: withLoad });
  } catch (error) {
    console.error("[MESSAGES_SUPPORT_AGENTS]", error);
    return NextResponse.json(
      { error: "Failed to load agents" },
      { status: 500 }
    );
  }
}

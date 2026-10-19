/**
 * Auth helpers for the messaging system.
 * Users use NextAuth; staff may use NextAuth or admin-panel localStorage + headers.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prismadb";
import type { TeamMember, TeamRole } from "@prisma/client";

const INBOX_ROLES: TeamRole[] = ["SUPER_ADMIN", "CUSTOMER_SUPPORT"];

export type MessagingActor =
  | { kind: "user"; userId: string; email: string; name: string | null }
  | {
      kind: "staff";
      teamMember: TeamMember;
      canAccessInbox: boolean;
    };

export function canAccessStaffInbox(role: TeamRole): boolean {
  return INBOX_ROLES.includes(role);
}

export async function resolveMessagingActor(
  req: Request
): Promise<MessagingActor | null> {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    if (session.user.isTeamMember) {
      const teamMember = await prisma.teamMember.findUnique({
        where: { id: session.user.id },
      });
      if (teamMember?.isActive) {
        return {
          kind: "staff",
          teamMember,
          canAccessInbox: canAccessStaffInbox(teamMember.role),
        };
      }
    } else {
      return {
        kind: "user",
        userId: session.user.id,
        email: session.user.email || "",
        name: session.user.name || null,
      };
    }
  }

  const adminAuth = req.headers.get("x-admin-auth");
  const adminEmail =
    req.headers.get("x-admin-email") || req.headers.get("x-team-email");

  if (adminAuth === "true" && adminEmail) {
    const teamMember = await prisma.teamMember.findUnique({
      where: { email: adminEmail },
    });
    if (teamMember?.isActive) {
      return {
        kind: "staff",
        teamMember,
        canAccessInbox: canAccessStaffInbox(teamMember.role),
      };
    }
  }

  return null;
}

export function buildSubjectKey(
  subjectType: string,
  subjectId?: string | null
): string {
  if (subjectType === "GENERAL" || !subjectId) {
    return "GENERAL";
  }
  return `${subjectType}:${subjectId}`;
}

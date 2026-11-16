/**
 * Auth helpers for the messaging system.
 * Bearer-first mobile access tokens, otherwise NextAuth cookie session.
 * Client-supplied admin headers are never trusted.
 */

import prisma from "@/lib/prismadb";
import type { TeamMember, TeamRole } from "@prisma/client";
import { AuthError, requireAuth } from "@/lib/require-auth";

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
  try {
    const actor = await requireAuth(req);

    // Mobile Bearer sessions are always consumer users (never staff).
    if (actor.kind === "mobile") {
      return {
        kind: "user",
        userId: actor.userId,
        email: actor.email,
        name: actor.name,
      };
    }

    if (actor.isTeamMember) {
      const teamMember = await prisma.teamMember.findUnique({
        where: { id: actor.userId },
      });
      if (teamMember?.isActive) {
        return {
          kind: "staff",
          teamMember,
          canAccessInbox: canAccessStaffInbox(teamMember.role),
        };
      }
      return null;
    }

    return {
      kind: "user",
      userId: actor.userId,
      email: actor.email,
      name: actor.name,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return null;
    }
    throw error;
  }
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

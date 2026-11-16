/**
 * Server-side staff authorization for admin and privileged APIs.
 * Accepts only a verified NextAuth session for an active TeamMember
 * or a User with role ADMIN. Never trusts client-supplied headers.
 */

import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import type { TeamMember, TeamRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prismadb";

export type StaffActor =
  | {
      kind: "team";
      teamMember: TeamMember;
      id: string;
      email: string;
      name: string | null;
      role: TeamRole | string;
    }
  | {
      kind: "admin_user";
      id: string;
      email: string;
      name: string | null;
      role: "ADMIN";
    };

export class StaffAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "StaffAuthError";
    this.status = status;
  }
}

/**
 * Resolve the authenticated staff actor from the NextAuth session only.
 * Returns null when unauthenticated or not staff.
 */
export async function resolveStaffActor(): Promise<StaffActor | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  if (session.user.isTeamMember) {
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: session.user.id },
    });

    if (!teamMember || !teamMember.isActive) {
      return null;
    }

    return {
      kind: "team",
      teamMember,
      id: teamMember.id,
      email: teamMember.email,
      name: teamMember.name,
      role: teamMember.role,
    };
  }

  if (session.user.role === "ADMIN") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return null;
    }

    return {
      kind: "admin_user",
      id: user.id,
      email: user.email,
      name: user.name,
      role: "ADMIN",
    };
  }

  return null;
}

/**
 * Require an authenticated staff actor. Throws StaffAuthError on failure.
 */
export async function requireStaff(): Promise<StaffActor> {
  const actor = await resolveStaffActor();
  if (!actor) {
    throw new StaffAuthError("Unauthorized", 401);
  }
  return actor;
}

/**
 * Boolean helper for call sites that already branch on authorization.
 */
export async function isAuthenticatedStaff(): Promise<boolean> {
  return (await resolveStaffActor()) !== null;
}

export function staffUnauthorizedResponse(
  error: unknown = new StaffAuthError("Unauthorized", 401)
): NextResponse {
  if (error instanceof StaffAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Run a privileged handler after requiring staff auth.
 */
export async function withStaffAuth<T>(
  handler: (actor: StaffActor) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const actor = await requireStaff();
    return await handler(actor);
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    throw error;
  }
}

import { NextResponse } from "next/server";
import {
  requireStaff,
  StaffAuthError,
  staffUnauthorizedResponse,
} from "@/lib/staff-auth";

/**
 * Returns the authenticated staff session for the admin UI.
 * Relies on NextAuth cookies only.
 */
export async function GET() {
  try {
    const actor = await requireStaff();
    return NextResponse.json({
      id: actor.id,
      name: actor.name,
      email: actor.email,
      role: actor.role,
      kind: actor.kind,
    });
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_SESSION_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { toPublicUser } from "@/lib/mobile-auth";
import { AuthError, authErrorResponse, requireAuth } from "@/lib/require-auth";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        image: true,
        agentProfile: { select: { status: true } },
      },
    });

    if (!user) {
      // Staff team members authenticate via web cookies but are not User rows.
      if (actor.kind === "web" && actor.isTeamMember) {
        return NextResponse.json({
          id: actor.userId,
          email: actor.email,
          name: actor.name,
          role: actor.role,
          phoneNumber: null,
          image: null,
          agentStatus: null,
          isTeamMember: true,
        });
      }
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...toPublicUser(user),
      isTeamMember: actor.kind === "web" ? actor.isTeamMember : false,
      authKind: actor.kind,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[API_ME]", error);
    return NextResponse.json(
      { error: "Failed to load profile", code: "ME_FAILED" },
      { status: 500 }
    );
  }
}

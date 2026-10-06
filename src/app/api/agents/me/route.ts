import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prismadb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.agentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        dedicatedSupport: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Agent profile not found" }, { status: 404 });
    }

    if (profile.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Agent account is not active", status: profile.status },
        { status: 403 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[AGENTS_ME_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

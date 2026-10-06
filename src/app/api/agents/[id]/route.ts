import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

type RouteContext = { params: Promise<{ id: string }> };

/** Public agent trust profile for ACTIVE agents. `id` is AgentProfile id or User id. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    let profile = await prisma.agentProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    if (!profile) {
      profile = await prisma.agentProfile.findUnique({
        where: { userId: id },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      });
    }

    if (!profile || profile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({
      agent: {
        id: profile.id,
        userId: profile.userId,
        name: profile.user.name,
        image: profile.user.image,
        businessName: profile.businessName,
        location: profile.location,
        identityVerified: profile.identityVerified,
        officeVerified: profile.officeVerified,
        propertiesSold: profile.propertiesSold,
        verifiedListings: profile.verifiedListings,
        documentDisputes: profile.documentDisputes,
        cancelledTransactions: profile.cancelledTransactions,
        avgResponseMinutes: profile.avgResponseMinutes,
        memberSince: profile.memberSince,
        trustScore: profile.trustScore,
        isGolden: profile.isGolden,
      },
    });
  } catch (error) {
    console.error("[PUBLIC_AGENT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

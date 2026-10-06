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

    const agentId = session.user.id;

    const profile = await prisma.agentProfile.findUnique({
      where: { userId: agentId },
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

    if (!profile || profile.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Agent account is not active", status: profile?.status },
        { status: 403 }
      );
    }

    const now = new Date();

    const [requests, target, assignedForVerification, verifiedInventory, completedByAgent] =
      await Promise.all([
        prisma.agentRequest.findMany({
          where: { agentId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.agentTarget.findFirst({
          where: {
            agentId,
            isActive: true,
            periodStart: { lte: now },
            periodEnd: { gte: now },
          },
          orderBy: { periodEnd: "desc" },
        }),
        prisma.property.findMany({
          where: {
            assignedAgentId: agentId,
            agentVerificationStatus: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"] },
          },
          include: {
            city: { select: { id: true, name: true, province: true } },
          },
          orderBy: { assignedAt: "desc" },
        }),
        prisma.property.findMany({
          where: { status: { in: ["VERIFIED", "ACTIVE"] } },
          include: {
            city: { select: { id: true, name: true } },
          },
          orderBy: { verifiedAt: "desc" },
          take: 12,
        }),
        prisma.property.findMany({
          where: {
            assignedAgentId: agentId,
            agentVerificationStatus: "COMPLETED",
          },
          include: {
            city: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
      ]);

    // Progress toward active target
    let progress = {
      deals: 0,
      verifications: 0,
      referrals: 0,
    };
    if (target) {
      const inPeriod = {
        createdAt: { gte: target.periodStart, lte: target.periodEnd },
      };
      const [deals, verifications, referrals] = await Promise.all([
        prisma.agentRequest.count({
          where: {
            agentId,
            type: "DEAL_CLOSE",
            status: { in: ["APPROVED", "COMPLETED"] },
            ...inPeriod,
          },
        }),
        prisma.property.count({
          where: {
            assignedAgentId: agentId,
            agentVerificationStatus: "COMPLETED",
            updatedAt: { gte: target.periodStart, lte: target.periodEnd },
          },
        }),
        prisma.agentRequest.count({
          where: {
            agentId,
            type: "CLIENT_REFERRAL",
            status: { in: ["APPROVED", "COMPLETED"] },
            ...inPeriod,
          },
        }),
      ]);
      progress = { deals, verifications, referrals };
    }

    const earnings = {
      pending: 0,
      approved: 0,
      paid: 0,
    };
    for (const r of requests) {
      const amount = (r.commissionAmount || 0) + (r.bonusAmount || 0);
      if (!amount) continue;
      if (r.payoutStatus === "PAID") earnings.paid += amount;
      else if (r.payoutStatus === "APPROVED") earnings.approved += amount;
      else earnings.pending += amount;
    }

    // Opportunities: verified inventory near agent location (simple city/location match)
    const locationHint = profile.location?.split(",")[0]?.trim().toLowerCase() || "";
    const opportunities = verifiedInventory.filter((p) => {
      if (!locationHint) return true;
      const city = p.city?.name?.toLowerCase() || "";
      const address = p.address?.toLowerCase() || "";
      return city.includes(locationHint) || address.includes(locationHint) || locationHint.includes(city);
    });

    return NextResponse.json({
      profile,
      target,
      progress,
      earnings,
      requests,
      assignedForVerification,
      verifiedInventory,
      completedByAgent,
      opportunities: opportunities.length ? opportunities : verifiedInventory.slice(0, 8),
    });
  } catch (error) {
    console.error("[AGENTS_DASHBOARD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

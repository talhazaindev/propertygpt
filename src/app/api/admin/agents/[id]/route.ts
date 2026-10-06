import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { agentProfileAdminPatchSchema } from "@/schemas/agent";
import { computeTrustScore } from "@/lib/agent-trust";
import { sendAgentActivationEmail } from "@/lib/email";

function isAdminOrStaff(request: Request) {
  return request.headers.get("x-admin-auth") === "true";
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    if (!isAdminOrStaff(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const agent = await prisma.agentProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
        dedicatedSupport: {
          select: { id: true, name: true, email: true, phoneNumber: true, role: true },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const [requests, activities] = await Promise.all([
      prisma.agentRequest.findMany({
        where: { agentId: agent.userId },
        orderBy: { createdAt: "desc" },
        include: {
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.agentActivity.findMany({
        where: { agentId: agent.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({ agent, requests, activities });
  } catch (error) {
    console.error("[ADMIN_AGENTS_ID_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!isAdminOrStaff(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validation = agentProfileAdminPatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.agentProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const data = validation.data;
    const previousStatus = existing.status;

    const nextIdentity = data.identityVerified ?? existing.identityVerified;
    const nextOffice = data.officeVerified ?? existing.officeVerified;
    const nextSold = data.propertiesSold ?? existing.propertiesSold;
    const nextListings = data.verifiedListings ?? existing.verifiedListings;
    const nextDisputes = data.documentDisputes ?? existing.documentDisputes;
    const nextCancelled = data.cancelledTransactions ?? existing.cancelledTransactions;
    const nextAvg =
      data.avgResponseMinutes !== undefined
        ? data.avgResponseMinutes
        : existing.avgResponseMinutes;
    const nextMemberSince =
      data.memberSince !== undefined
        ? data.memberSince
          ? new Date(data.memberSince)
          : null
        : existing.memberSince;

    let trustScore = existing.trustScore;
    let trustScoreOverride = data.trustScoreOverride ?? existing.trustScoreOverride;

    if (typeof data.trustScore === "number") {
      trustScore = data.trustScore;
      trustScoreOverride = true;
    } else if (data.recomputeTrustScore || !trustScoreOverride) {
      trustScore = computeTrustScore({
        identityVerified: nextIdentity,
        officeVerified: nextOffice,
        propertiesSold: nextSold,
        verifiedListings: nextListings,
        documentDisputes: nextDisputes,
        cancelledTransactions: nextCancelled,
        avgResponseMinutes: nextAvg,
        memberSince: nextMemberSince,
      });
      if (data.recomputeTrustScore) {
        trustScoreOverride = false;
      }
    }

    const updatePayload: Record<string, unknown> = {
      identityVerified: nextIdentity,
      officeVerified: nextOffice,
      propertiesSold: nextSold,
      verifiedListings: nextListings,
      documentDisputes: nextDisputes,
      cancelledTransactions: nextCancelled,
      avgResponseMinutes: nextAvg,
      memberSince: nextMemberSince,
      trustScore,
      trustScoreOverride,
    };

    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.isGolden !== undefined) updatePayload.isGolden = data.isGolden;
    if (data.dedicatedSupportId !== undefined) {
      updatePayload.dedicatedSupportId = data.dedicatedSupportId || null;
    }
    if (data.adminNotes !== undefined) updatePayload.adminNotes = data.adminNotes;

    if (data.status === "ACTIVE" && previousStatus !== "ACTIVE") {
      updatePayload.activatedAt = new Date();
      if (!nextMemberSince) {
        updatePayload.memberSince = new Date();
      }
    }

    const agent = await prisma.agentProfile.update({
      where: { id },
      data: updatePayload,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
        dedicatedSupport: {
          select: { id: true, name: true, email: true, phoneNumber: true, role: true },
        },
      },
    });

    if (data.status === "ACTIVE" && previousStatus !== "ACTIVE") {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { emailVerified: new Date() },
      });

      await prisma.agentActivity.create({
        data: {
          agentId: existing.userId,
          kind: "ACTIVATED",
          message: "Agent account approved and activated",
          meta: { previousStatus },
        },
      });

      await sendAgentActivationEmail({
        to: existing.user.email,
        name: existing.user.name || "Agent",
        businessName: existing.businessName,
      });
    } else if (data.status && data.status !== previousStatus) {
      await prisma.agentActivity.create({
        data: {
          agentId: existing.userId,
          kind: "STATUS_CHANGED",
          message: `Status changed from ${previousStatus} to ${data.status}`,
          meta: { previousStatus, status: data.status },
        },
      });
    } else {
      await prisma.agentActivity.create({
        data: {
          agentId: existing.userId,
          kind: "PROFILE_UPDATED",
          message: "Agent profile / reputation updated by admin",
          meta: data as object,
        },
      });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("[ADMIN_AGENTS_ID_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

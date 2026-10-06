import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { agentTargetSchema } from "@/schemas/agent";

function isAdminOrStaff(request: Request) {
  return request.headers.get("x-admin-auth") === "true";
}

type RouteContext = { params: Promise<{ id: string }> };

/** List targets for an agent (id = AgentProfile id or User id). */
export async function GET(request: Request, context: RouteContext) {
  try {
    if (!isAdminOrStaff(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    let agentUserId = id;
    const profile = await prisma.agentProfile.findUnique({ where: { id } });
    if (profile) agentUserId = profile.userId;

    const targets = await prisma.agentTarget.findMany({
      where: { agentId: agentUserId },
      orderBy: { periodStart: "desc" },
    });

    return NextResponse.json({ targets, agentId: agentUserId });
  } catch (error) {
    console.error("[ADMIN_AGENT_TARGETS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    if (!isAdminOrStaff(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    let agentUserId = id;
    const profile = await prisma.agentProfile.findUnique({ where: { id } });
    if (profile) agentUserId = profile.userId;

    const user = await prisma.user.findUnique({ where: { id: agentUserId } });
    if (!user || user.role !== "AGENT") {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = agentTargetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Deactivate overlapping active targets for clarity
    if (data.isActive !== false) {
      await prisma.agentTarget.updateMany({
        where: { agentId: agentUserId, isActive: true },
        data: { isActive: false },
      });
    }

    const target = await prisma.agentTarget.create({
      data: {
        agentId: agentUserId,
        label: data.label || "This month",
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        dealsTarget: data.dealsTarget,
        verificationsTarget: data.verificationsTarget,
        referralsTarget: data.referralsTarget,
        rewardDescription: data.rewardDescription || null,
        rewardAmount: data.rewardAmount ?? null,
        isActive: data.isActive !== false,
      },
    });

    await prisma.agentActivity.create({
      data: {
        agentId: agentUserId,
        kind: "TARGET_SET",
        message: `New target set: ${target.label}`,
        meta: { targetId: target.id },
      },
    });

    return NextResponse.json({ target }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_AGENT_TARGETS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

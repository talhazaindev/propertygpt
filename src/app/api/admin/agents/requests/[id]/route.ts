import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { agentRequestAdminPatchSchema } from "@/schemas/agent";

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
    const agentRequest = await prisma.agentRequest.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            agentProfile: true,
          },
        },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!agentRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ request: agentRequest });
  } catch (error) {
    console.error("[ADMIN_AGENT_REQUEST_GET]", error);
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
    const validation = agentRequestAdminPatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.agentRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const data = validation.data;
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.commissionAmount !== undefined) {
      updateData.commissionAmount = data.commissionAmount;
    }
    if (data.bonusAmount !== undefined) updateData.bonusAmount = data.bonusAmount;
    if (data.payoutStatus !== undefined) updateData.payoutStatus = data.payoutStatus;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
    if (data.reviewedById !== undefined) {
      updateData.reviewedById = data.reviewedById || null;
    }

    const updated = await prisma.agentRequest.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            agentProfile: { select: { id: true, businessName: true } },
          },
        },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.agentActivity.create({
      data: {
        agentId: existing.agentId,
        kind: "REQUEST_UPDATED",
        message: `Request "${existing.title}" updated by admin`,
        meta: { requestId: id, ...data },
        actorId: data.reviewedById || undefined,
      },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("[ADMIN_AGENT_REQUEST_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import prisma from "@/lib/prismadb";

function isAdminOrStaff(req: NextRequest) {
  return req.headers.get("x-admin-auth") === "true";
}

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Assign (or unassign) a marketplace agent to verify a property.
 * Requires admin to have prepared/edited the listing first (adminPreparedAt).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (!isAdminOrStaff(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: propertyId } = await context.params;
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const body = await request.json();
    const agentId = body.agentId as string | null | undefined;
    const force = body.force === true;

    const client = await clientPromise;
    const db = client.db();
    const properties = db.collection("Property");
    const objectId = new ObjectId(propertyId);

    const property = await properties.findOne({ _id: objectId });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Unassign
    if (!agentId) {
      await properties.updateOne(
        { _id: objectId },
        {
          $set: {
            assignedAgentId: null,
            assignedAt: null,
            agentVerificationStatus: "NONE",
            agentVerificationNotes: null,
            agentVerificationSubmittedAt: null,
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ message: "Agent unassigned", assignedAgentId: null });
    }

    if (!ObjectId.isValid(agentId)) {
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
    }

    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      include: { agentProfile: true },
    });

    if (!agent || agent.role !== "AGENT" || agent.agentProfile?.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Select an active Manzil agent" },
        { status: 400 }
      );
    }

    if (!property.adminPreparedAt && !force) {
      return NextResponse.json(
        {
          error:
            "Edit and save all property details before assigning an agent. Then try again.",
          code: "NOT_PREPARED",
        },
        { status: 400 }
      );
    }

    if (!["PENDING", "REJECTED"].includes(property.status)) {
      return NextResponse.json(
        { error: "Only pending (or rejected) listings can be assigned for agent verification" },
        { status: 400 }
      );
    }

    await properties.updateOne(
      { _id: objectId },
      {
        $set: {
          assignedAgentId: new ObjectId(agentId),
          assignedAt: new Date(),
          agentVerificationStatus: "ASSIGNED",
          agentVerificationNotes: null,
          agentVerificationSubmittedAt: null,
          updatedAt: new Date(),
        },
      }
    );

    await prisma.agentActivity.create({
      data: {
        agentId,
        kind: "PROPERTY_ASSIGNED",
        message: `Assigned to verify property: ${property.title}`,
        meta: { propertyId },
      },
    });

    return NextResponse.json({
      message: "Property assigned to agent for verification",
      assignedAgentId: agentId,
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        businessName: agent.agentProfile?.businessName,
      },
    });
  } catch (error) {
    console.error("[PROPERTY_ASSIGN]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import prisma from "@/lib/prismadb";
import { agentPropertyVerificationSchema } from "@/schemas/agent";

type RouteContext = { params: Promise<{ id: string }> };

/** Agent submits verification work on an assigned property. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: propertyId } = await context.params;
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const body = await request.json();
    const validation = agentPropertyVerificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const properties = db.collection("Property");
    const objectId = new ObjectId(propertyId);
    const property = await properties.findOne({ _id: objectId });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const assignedId = property.assignedAgentId?.toString?.() || property.assignedAgentId;
    if (assignedId !== session.user.id) {
      return NextResponse.json({ error: "This property is not assigned to you" }, { status: 403 });
    }

    const nextStatus = validation.data.markInProgress ? "IN_PROGRESS" : "SUBMITTED";

    await properties.updateOne(
      { _id: objectId },
      {
        $set: {
          agentVerificationNotes: validation.data.notes,
          agentVerificationStatus: nextStatus,
          agentVerificationSubmittedAt:
            nextStatus === "SUBMITTED" ? new Date() : property.agentVerificationSubmittedAt || null,
          updatedAt: new Date(),
        },
      }
    );

    await prisma.agentActivity.create({
      data: {
        agentId: session.user.id,
        kind: nextStatus === "SUBMITTED" ? "VERIFICATION_SUBMITTED" : "VERIFICATION_IN_PROGRESS",
        message:
          nextStatus === "SUBMITTED"
            ? `Submitted verification for: ${property.title}`
            : `Started verification for: ${property.title}`,
        meta: { propertyId },
      },
    });

    return NextResponse.json({
      message:
        nextStatus === "SUBMITTED"
          ? "Verification submitted. Manzil will review and finalize."
          : "Marked in progress.",
      status: nextStatus,
    });
  } catch (error) {
    console.error("[AGENT_PROPERTY_VERIFY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

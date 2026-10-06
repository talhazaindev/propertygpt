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
    const markInProgress = body.markInProgress === true;

    // In-progress only needs light notes; full submit needs documents + fields
    if (markInProgress) {
      const notes =
        typeof body.remarks === "string"
          ? body.remarks
          : typeof body.notes === "string"
            ? body.notes
            : "Started verification work.";

      const client = await clientPromise;
      const db = client.db();
      const properties = db.collection("Property");
      const objectId = new ObjectId(propertyId);
      const property = await properties.findOne({ _id: objectId });

      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }

      const assignedId =
        property.assignedAgentId?.toString?.() || property.assignedAgentId;
      if (assignedId !== session.user.id) {
        return NextResponse.json(
          { error: "This property is not assigned to you" },
          { status: 403 }
        );
      }

      await properties.updateOne(
        { _id: objectId },
        {
          $set: {
            agentVerificationStatus: "IN_PROGRESS",
            agentVerificationNotes: notes,
            agentVerificationRemarks: notes,
            updatedAt: new Date(),
          },
        }
      );

      await prisma.agentActivity.create({
        data: {
          agentId: session.user.id,
          kind: "VERIFICATION_IN_PROGRESS",
          message: `Started verification for: ${property.title}`,
          meta: { propertyId },
        },
      });

      return NextResponse.json({
        message: "Marked in progress.",
        status: "IN_PROGRESS",
      });
    }

    const validation = agentPropertyVerificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const remarks = data.remarks || data.notes || "";

    const client = await clientPromise;
    const db = client.db();
    const properties = db.collection("Property");
    const objectId = new ObjectId(propertyId);
    const property = await properties.findOne({ _id: objectId });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const assignedId =
      property.assignedAgentId?.toString?.() || property.assignedAgentId;
    if (assignedId !== session.user.id) {
      return NextResponse.json(
        { error: "This property is not assigned to you" },
        { status: 403 }
      );
    }

    await properties.updateOne(
      { _id: objectId },
      {
        $set: {
          agentVerificationStatus: "SUBMITTED",
          agentVerificationNotes: remarks,
          agentVerificationRemarks: remarks,
          agentVerifiedItems: data.verifiedItems,
          agentVerificationSource: data.verificationSource,
          agentVerifiedDocuments: data.documents,
          agentVerificationSubmittedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    await prisma.agentActivity.create({
      data: {
        agentId: session.user.id,
        kind: "VERIFICATION_SUBMITTED",
        message: `Submitted verification for: ${property.title}`,
        meta: {
          propertyId,
          documentCount: data.documents.length,
          verificationSource: data.verificationSource,
        },
      },
    });

    return NextResponse.json({
      message:
        "Verification submitted with documents. Manzil will review and finalize.",
      status: "SUBMITTED",
    });
  } catch (error) {
    console.error("[AGENT_PROPERTY_VERIFY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

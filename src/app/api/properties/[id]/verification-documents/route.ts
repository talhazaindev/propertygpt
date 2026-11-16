/**
 * List verification documents for authorized owner / assigned agent / staff.
 * Returns metadata and authenticated download paths — never durable public URLs.
 */

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import {
  canAccessVerificationDocuments,
  toSafeVerificationDocuments,
} from "@/lib/verification-documents";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const property = await db.collection("Property").findOne({
      _id: new ObjectId(id),
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const allowed = await canAccessVerificationDocuments(
      {
        id,
        ownerId: property.ownerId ? property.ownerId.toString() : null,
        assignedAgentId: property.assignedAgentId
          ? property.assignedAgentId.toString()
          : null,
      },
      session
    );

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sellerDocs = toSafeVerificationDocuments(
      id,
      property.verificationDocuments
    );
    const agentDocs = toSafeVerificationDocuments(
      id,
      property.agentVerifiedDocuments
    ).map((doc) => ({
      ...doc,
      source: "agent" as const,
      downloadPath: `${doc.downloadPath}?source=agent`,
    }));

    return NextResponse.json({
      documents: [
        ...sellerDocs.map((doc) => ({ ...doc, source: "seller" as const })),
        ...agentDocs,
      ],
    });
  } catch (error) {
    console.error("[PROPERTY_VERIFICATION_DOCS_LIST]", error);
    return NextResponse.json(
      { error: "Failed to list verification documents" },
      { status: 500 }
    );
  }
}

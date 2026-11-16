/**
 * Issue a short-lived signed download for one verification document.
 * Authorization: property owner, assigned active agent, or staff session.
 */

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import {
  canAccessVerificationDocuments,
  createSignedDownloadUrl,
  findVerificationDocument,
  VERIFICATION_SIGNED_URL_TTL_SECONDS,
} from "@/lib/verification-documents";

type RouteContext = {
  params: Promise<{ id: string; docId: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id, docId } = await context.params;
    if (!id || !ObjectId.isValid(id) || !docId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

    const source = req.nextUrl.searchParams.get("source");
    const docs =
      source === "agent"
        ? property.agentVerifiedDocuments
        : property.verificationDocuments;

    const doc = findVerificationDocument(id, docs, docId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const signedUrl = await createSignedDownloadUrl(doc);
    if (!signedUrl) {
      return NextResponse.json(
        { error: "Unable to create signed download URL" },
        { status: 502 }
      );
    }

    const wantsJson = (req.headers.get("accept") || "").includes(
      "application/json"
    );

    // Relative local/dev paths are only served to authorized callers via redirect.
    if (signedUrl.startsWith("/")) {
      return NextResponse.redirect(new URL(signedUrl, req.url));
    }

    if (wantsJson) {
      return NextResponse.json({
        url: signedUrl,
        expiresIn: VERIFICATION_SIGNED_URL_TTL_SECONDS,
      });
    }

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("[PROPERTY_VERIFICATION_DOC_DOWNLOAD]", error);
    return NextResponse.json(
      { error: "Failed to create download URL" },
      { status: 500 }
    );
  }
}

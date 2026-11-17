import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import { ObjectId } from "mongodb";
import { z } from "zod";
import prisma from "@/lib/prismadb";
import clientPromise from "@/lib/mongodb";
import { revokeAllMobileSessions, toPublicUser } from "@/lib/mobile-auth";
import {
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { AuthError, authErrorResponse, requireAuth } from "@/lib/require-auth";

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirm: z.literal(true, {
    errorMap: () => ({ message: "Confirmation is required" }),
  }),
});

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80)
    .optional(),
  phoneNumber: z
    .union([
      z.literal(""),
      z
        .string()
        .regex(/^03\d{9}$/, "Phone number must be in format 03XXXXXXXXX"),
    ])
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        image: true,
        agentProfile: { select: { status: true } },
      },
    });

    if (!user) {
      // Staff team members authenticate via web cookies but are not User rows.
      if (actor.kind === "web" && actor.isTeamMember) {
        return NextResponse.json({
          id: actor.userId,
          email: actor.email,
          name: actor.name,
          role: actor.role,
          phoneNumber: null,
          image: null,
          agentStatus: null,
          isTeamMember: true,
        });
      }
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...toPublicUser(user),
      isTeamMember: actor.kind === "web" ? actor.isTeamMember : false,
      authKind: actor.kind,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[API_ME]", error);
    return NextResponse.json(
      { error: "Failed to load profile", code: "ME_FAILED" },
      { status: 500 }
    );
  }
}

/**
 * Update display name / phone for the signed-in consumer user.
 */
export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireAuth(req);

    if (actor.kind === "web" && actor.isTeamMember) {
      return NextResponse.json(
        { error: "Staff profiles cannot be edited here", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid request",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    if (
      parsed.data.name === undefined &&
      parsed.data.phoneNumber === undefined
    ) {
      return NextResponse.json(
        { error: "No changes to update", code: "NO_CHANGES" },
        { status: 400 }
      );
    }

    const data: { name?: string; phoneNumber?: string | null } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.phoneNumber !== undefined) {
      data.phoneNumber =
        parsed.data.phoneNumber === "" ? null : parsed.data.phoneNumber;
    }

    const user = await prisma.user.update({
      where: { id: actor.userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        image: true,
        agentProfile: { select: { status: true } },
      },
    });

    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[API_ME_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update profile", code: "UPDATE_FAILED" },
      { status: 500 }
    );
  }
}

/**
 * Self-service account deletion (store requirement).
 * Requires password confirmation. Consumer users only.
 */
export async function DELETE(req: NextRequest) {
  try {
    const actor = await requireAuth(req);

    if (actor.kind === "web" && actor.isTeamMember) {
      return NextResponse.json(
        { error: "Staff accounts cannot be deleted here", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (actor.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts cannot be deleted here", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const limited = await enforceRateLimits([
      {
        key: `me-delete:user:${actor.userId}`,
        limit: 5,
        windowSec: 60 * 60,
      },
      { key: `me-delete:ip:${getClientIp(req)}`, limit: 10, windowSec: 60 * 60 },
    ]);
    if (limited) {
      return rateLimitResponse(limited);
    }

    const body = await req.json().catch(() => null);
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid request",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: {
        id: true,
        email: true,
        hashedPassword: true,
        role: true,
      },
    });

    if (!user?.hashedPassword) {
      return NextResponse.json(
        { error: "Account not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const valid = await compare(parsed.data.password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect password", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    await revokeAllMobileSessions(user.id);

    const client = await clientPromise;
    const db = client.db();
    const userOid = new ObjectId(user.id);

    const owned = await db
      .collection("Property")
      .find({ ownerId: userOid }, { projection: { _id: 1 } })
      .toArray();
    const ownedIds = owned.map((p) => p._id);

    if (ownedIds.length) {
      await db.collection("Sale").deleteMany({
        $or: [
          { propertyId: { $in: ownedIds } },
          { propertyId: { $in: ownedIds.map((id) => id.toString()) } },
        ],
      });
      await db.collection("Property").deleteMany({ _id: { $in: ownedIds } });
    }

    await db.collection("Sale").deleteMany({
      $or: [
        { buyerId: user.id },
        { sellerId: user.id },
        { buyerId: userOid },
        { sellerId: userOid },
      ],
    });

    await db.collection("Property").updateMany(
      { assignedAgentId: userOid },
      { $set: { assignedAgentId: null, assignedAt: null } }
    );

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length) {
      await prisma.message.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
      await prisma.conversation.deleteMany({
        where: { id: { in: conversationIds } },
      });
    }

    await prisma.agentActivity.deleteMany({ where: { agentId: user.id } }).catch(() => undefined);
    await prisma.agentTarget.deleteMany({ where: { agentId: user.id } }).catch(() => undefined);
    await prisma.agentRequest.deleteMany({ where: { agentId: user.id } }).catch(() => undefined);
    await prisma.agentProfile.deleteMany({ where: { userId: user.id } }).catch(() => undefined);
    await prisma.mobileSession.deleteMany({ where: { userId: user.id } });
    await prisma.emailOtp.deleteMany({ where: { email: user.email } });
    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ success: true, code: "ACCOUNT_DELETED" });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[API_ME_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete account", code: "DELETE_FAILED" },
      { status: 500 }
    );
  }
}

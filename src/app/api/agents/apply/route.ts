import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prismadb";
import { agentApplySchema } from "@/schemas/agent";
import { computeTrustScore } from "@/lib/agent-trust";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = agentApplySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      phoneNumber,
      businessName,
      location,
      businessAddress,
    } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();
    const trustScore = computeTrustScore({
      identityVerified: false,
      officeVerified: false,
      propertiesSold: 0,
      verifiedListings: 0,
      documentDisputes: 0,
      cancelledTransactions: 0,
      avgResponseMinutes: null,
      memberSince: null,
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        phoneNumber,
        role: "AGENT",
        agentProfile: {
          create: {
            businessName,
            location,
            phoneNumber,
            businessAddress,
            status: "PENDING",
            trustScore,
          },
        },
      },
      include: {
        agentProfile: true,
      },
    });

    await prisma.agentActivity.create({
      data: {
        agentId: user.id,
        kind: "APPLICATION_SUBMITTED",
        message: `Agent application submitted for ${businessName}`,
        meta: { email, location, businessName },
      },
    });

    return NextResponse.json(
      {
        message:
          "Application received. We will notify you by email once your account is approved.",
        application: {
          id: user.agentProfile?.id,
          status: user.agentProfile?.status,
          businessName,
          email,
          createdAt: now,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[AGENT_APPLY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

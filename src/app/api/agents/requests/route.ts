import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prismadb";
import { agentRequestCreateSchema } from "@/schemas/agent";

async function requireActiveAgent() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENT") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const profile = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile || profile.status !== "ACTIVE") {
    return {
      error: NextResponse.json({ error: "Agent account is not active" }, { status: 403 }),
    };
  }

  return { session, profile };
}

export async function GET() {
  try {
    const gate = await requireActiveAgent();
    if ("error" in gate && gate.error) return gate.error;

    const requests = await prisma.agentRequest.findMany({
      where: { agentId: gate.session!.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[AGENTS_REQUESTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireActiveAgent();
    if ("error" in gate && gate.error) return gate.error;

    const body = await request.json();
    const validation = agentRequestCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const created = await prisma.agentRequest.create({
      data: {
        agentId: gate.session!.user.id,
        type: data.type,
        title: data.title,
        description: data.description,
        propertyId: data.propertyId || null,
        clientName: data.clientName || null,
        clientPhone: data.clientPhone || null,
        clientEmail: data.clientEmail || null,
        estimatedValue: data.estimatedValue ?? null,
      },
    });

    await prisma.agentActivity.create({
      data: {
        agentId: gate.session!.user.id,
        kind: "REQUEST_CREATED",
        message: `Submitted ${data.type}: ${data.title}`,
        meta: { requestId: created.id, type: data.type },
      },
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    console.error("[AGENTS_REQUESTS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

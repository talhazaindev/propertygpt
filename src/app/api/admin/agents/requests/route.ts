import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

function isAdminOrStaff(request: Request) {
  return request.headers.get("x-admin-auth") === "true";
}

export async function GET(request: Request) {
  try {
    if (!isAdminOrStaff(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const agentId = searchParams.get("agentId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (agentId) where.agentId = agentId;

    const [requests, total] = await Promise.all([
      prisma.agentRequest.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              agentProfile: {
                select: {
                  id: true,
                  businessName: true,
                  isGolden: true,
                  trustScore: true,
                  status: true,
                },
              },
            },
          },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.agentRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("[ADMIN_AGENT_REQUESTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

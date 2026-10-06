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
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status");
    const isGolden = searchParams.get("isGolden");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (isGolden === "true") {
      where.isGolden = true;
    } else if (isGolden === "false") {
      where.isGolden = false;
    }

    if (query) {
      where.OR = [
        { businessName: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
        { phoneNumber: { contains: query, mode: "insensitive" } },
        { businessAddress: { contains: query, mode: "insensitive" } },
        { user: { email: { contains: query, mode: "insensitive" } } },
        { user: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    const [agents, total] = await Promise.all([
      prisma.agentProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              image: true,
              createdAt: true,
            },
          },
          dedicatedSupport: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.agentProfile.count({ where }),
    ]);

    const agentIds = agents.map((a) => a.userId);
    const pendingCounts =
      agentIds.length > 0
        ? await prisma.agentRequest.groupBy({
            by: ["agentId"],
            where: {
              agentId: { in: agentIds },
              status: { in: ["PENDING", "IN_REVIEW"] },
            },
            _count: { _all: true },
          })
        : [];

    const pendingMap = Object.fromEntries(
      pendingCounts.map((row) => [row.agentId, row._count._all])
    );

    return NextResponse.json({
      agents: agents.map((agent) => ({
        ...agent,
        pendingRequestCount: pendingMap[agent.userId] || 0,
      })),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("[ADMIN_AGENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

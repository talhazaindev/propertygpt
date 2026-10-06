import { NextResponse } from "next/server";

function isAdminOrStaff(request: Request) {
  return request.headers.get("x-admin-auth") === "true";
}

/** List active agents for assignment dropdowns. */
export async function GET(request: Request) {
  try {
    if (!isAdminOrStaff(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";

    const prisma = (await import("@/lib/prismadb")).default;

    const agents = await prisma.agentProfile.findMany({
      where: activeOnly ? { status: "ACTIVE" } : undefined,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { businessName: "asc" },
    });

    return NextResponse.json({
      agents: agents.map((a) => ({
        profileId: a.id,
        userId: a.userId,
        businessName: a.businessName,
        location: a.location,
        trustScore: a.trustScore,
        isGolden: a.isGolden,
        name: a.user.name,
        email: a.user.email,
      })),
    });
  } catch (error) {
    console.error("[ADMIN_AGENTS_LIST_SIMPLE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

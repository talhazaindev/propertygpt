import { NextResponse } from "next/server";
import {
  requireStaff,
  StaffAuthError,
  staffUnauthorizedResponse,
} from "@/lib/staff-auth";

/** List active agents for assignment dropdowns. */
export async function GET(request: Request) {
  try {
    await requireStaff();

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
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_AGENTS_LIST_SIMPLE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import type { Prisma, TeamRole } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "@/lib/prismadb";
import {
  requireStaff,
  StaffAuthError,
  staffUnauthorizedResponse,
} from "@/lib/staff-auth";

const ALLOWED_TEAM_ROLES = new Set<TeamRole>([
  "SUPER_ADMIN",
  "AREA_MANAGER",
  "PROPERTY_VERIFIER",
  "CONTENT_CREATOR",
  "CUSTOMER_SUPPORT",
  "INVENTORY_MANAGER",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();

    const { id: teamMemberId } = await params;

    if (!teamMemberId) {
      return NextResponse.json(
        { error: "Team member ID is required" },
        { status: 400 }
      );
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
      include: {
        city: {
          select: { id: true, name: true },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    const { hashedPassword, ...safeTeamMember } = teamMember;
    return NextResponse.json(safeTeamMember);
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_TEAM_MEMBER_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();

    const { id: teamMemberId } = await params;
    const body = await request.json();

    if (!teamMemberId) {
      return NextResponse.json(
        { error: "Team member ID is required" },
        { status: 400 }
      );
    }

    const existingTeamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!existingTeamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    if (body.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: body.cityId },
      });

      if (!city) {
        return NextResponse.json({ error: "City not found" }, { status: 400 });
      }
    }

    const updateData: Prisma.TeamMemberUpdateInput = {};

    if (typeof body.name === "string") {
      updateData.name = body.name;
    }
    if (typeof body.role === "string") {
      if (!ALLOWED_TEAM_ROLES.has(body.role as TeamRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updateData.role = body.role as TeamRole;
    }
    if (body.phoneNumber !== undefined) {
      updateData.phoneNumber = body.phoneNumber;
    }
    if (body.cityId !== undefined) {
      if (body.cityId === "none" || body.cityId === null) {
        updateData.city = { disconnect: true };
      } else {
        updateData.city = { connect: { id: body.cityId } };
      }
    }
    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive;
    } else if (body.isActive === "true" || body.isActive === "false") {
      updateData.isActive = body.isActive === "true";
    }
    if (typeof body.password === "string" && body.password.length > 0) {
      updateData.hashedPassword = await bcrypt.hash(body.password, 12);
    }

    const updatedTeamMember = await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: updateData,
      include: {
        city: {
          select: { id: true, name: true },
        },
      },
    });

    const { hashedPassword, ...safeTeamMember } = updatedTeamMember;
    return NextResponse.json(safeTeamMember);
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_TEAM_MEMBER_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();

    const { id: teamMemberId } = await params;

    if (!teamMemberId) {
      return NextResponse.json(
        { error: "Team member ID is required" },
        { status: 400 }
      );
    }

    const existingTeamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!existingTeamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    await prisma.teamMember.delete({
      where: { id: teamMemberId },
    });

    return NextResponse.json({ message: "Team member deleted successfully" });
  } catch (error) {
    if (error instanceof StaffAuthError) {
      return staffUnauthorizedResponse(error);
    }
    console.error("[ADMIN_TEAM_MEMBER_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

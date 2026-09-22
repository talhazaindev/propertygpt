import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { email },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!teamMember.isActive) {
      return NextResponse.json(
        {
          error:
            "Your account has been deactivated. Please contact an administrator.",
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      teamMember.hashedPassword
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const { hashedPassword: _, ...safeTeamMember } = teamMember;
    return NextResponse.json(safeTeamMember);
  } catch (error) {
    console.error("[TEAM_LOGIN]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

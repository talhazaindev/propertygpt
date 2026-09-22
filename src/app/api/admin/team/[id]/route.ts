import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

// GET a specific team member
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    const { id: teamMemberId } = await params;
    
    if (!teamMemberId) {
      return NextResponse.json(
        { error: "Team member ID is required" },
        { status: 400 }
      );
    }
    
    // Find the team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
      include: {
        city: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }
    
    // Remove sensitive information
    const { hashedPassword, ...safeTeamMember } = teamMember;
    
    return NextResponse.json(safeTeamMember);
  } catch (error) {
    console.error("[ADMIN_TEAM_MEMBER_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE a specific team member
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    const { id: teamMemberId } = await params;
    const body = await request.json();
    
    if (!teamMemberId) {
      return NextResponse.json(
        { error: "Team member ID is required" },
        { status: 400 }
      );
    }
    
    // Check if team member exists
    const existingTeamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId }
    });
    
    if (!existingTeamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }
    
    // If city ID is provided, check if it exists
    if (body.cityId) {
      const city = await prisma.city.findUnique({
        where: { id: body.cityId }
      });
      
      if (!city) {
        return NextResponse.json(
          { error: "City not found" },
          { status: 400 }
        );
      }
    }
    
    // Process password change if provided
    let updateData: any = {
      ...body
    };
    
    if (body.password) {
      const bcrypt = require('bcrypt');
      updateData.hashedPassword = await bcrypt.hash(body.password, 12);
      delete updateData.password;
    } else {
      delete updateData.password;
    }
    
    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.email; // Prevent email changes to avoid auth issues
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Update team member
    const updatedTeamMember = await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: updateData,
      include: {
        city: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    // Remove sensitive information
    const { hashedPassword, ...safeTeamMember } = updatedTeamMember;
    
    return NextResponse.json(safeTeamMember);
  } catch (error) {
    console.error("[ADMIN_TEAM_MEMBER_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a specific team member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    const { id: teamMemberId } = await params;
    
    if (!teamMemberId) {
      return NextResponse.json(
        { error: "Team member ID is required" },
        { status: 400 }
      );
    }
    
    // Check if team member exists
    const existingTeamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId }
    });
    
    if (!existingTeamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }
    
    // Delete team member
    await prisma.teamMember.delete({
      where: { id: teamMemberId }
    });
    
    return NextResponse.json({ message: "Team member deleted successfully" });
  } catch (error) {
    console.error("[ADMIN_TEAM_MEMBER_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

// GET a specific user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("[ADMIN_USER_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE a specific user
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    const userId = params.id;
    const body = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
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
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[ADMIN_USER_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a specific user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // In a production app, you'd want to add admin authentication checks here
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });
    
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("[ADMIN_USER_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
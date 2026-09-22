import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { registerSchema } from "@/schemas/auth";
import clientPromise from "@/lib/mongodb";
import prisma from "@/lib/prismadb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body using Zod schema
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data", issues: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { name, email, password, phoneNumber } = validation.data;
    
    // Connect to MongoDB directly
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('User');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    try {
      // Create user document directly in MongoDB
      const now = new Date();
      const result = await usersCollection.insertOne({
        name,
        email,
        hashedPassword,
        phoneNumber,
        role: "BUYER",
        createdAt: now,
        updatedAt: now,
      });
      
      if (!result.acknowledged) {
        throw new Error("Failed to insert user");
      }
      
      // Return the user without sensitive data
      const safeUser = {
        id: result.insertedId.toString(),
        name,
        email,
        phoneNumber,
        role: "BUYER",
        createdAt: now,
        updatedAt: now,
      };
      
      return NextResponse.json(
        { user: safeUser, message: "User registered successfully" },
        { status: 201 }
      );
    } catch (createError: any) {
      console.error("Error creating user:", createError);
      
      // Handle duplicate key error (code 11000)
      if (createError.code === 11000) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
      
      throw createError; // Re-throw if it's not a handled error
    }
    
  } catch (error) {
    console.error("[REGISTRATION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
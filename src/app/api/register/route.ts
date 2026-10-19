import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { registerSchema } from "@/schemas/auth";
import prisma from "@/lib/prismadb";
import { normalizeEmail, verifySignupToken } from "@/lib/otp";
import { sendBuyerWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, password, signupToken } = validation.data;
    const email = normalizeEmail(validation.data.email);
    const phoneNumber = validation.data.phoneNumber || undefined;

    const tokenCheck = verifySignupToken(signupToken, email, "SIGNUP");
    if (!tokenCheck.ok) {
      return NextResponse.json({ error: tokenCheck.error }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        phoneNumber,
        role: "BUYER",
        emailVerified: now,
      },
    });

    // Welcome email is best-effort — signup already succeeded after OTP verify
    const welcome = await sendBuyerWelcomeEmail({
      to: email,
      name: name || "there",
    });
    if (!welcome.ok) {
      console.error("[REGISTRATION_WELCOME_EMAIL]", welcome.error);
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: "User registered successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[REGISTRATION_ERROR]", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

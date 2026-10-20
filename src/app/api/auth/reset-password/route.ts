import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prismadb";
import { normalizeEmail, verifySignupToken } from "@/lib/otp";
import { resetPasswordSchema } from "@/schemas/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input data", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const email = normalizeEmail(validation.data.email);
    const { resetToken, password } = validation.data;

    const tokenCheck = verifySignupToken(resetToken, email, "PASSWORD_RESET");
    if (!tokenCheck.ok) {
      return NextResponse.json({ error: tokenCheck.error }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [user, teamMember] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      prisma.teamMember.findUnique({ where: { email }, select: { id: true } }),
    ]);

    if (!user && !teamMember) {
      return NextResponse.json(
        { error: "No account found for this email" },
        { status: 404 }
      );
    }

    // Team members authenticate first in login — update that account when present
    if (teamMember) {
      await prisma.teamMember.update({
        where: { id: teamMember.id },
        data: { hashedPassword },
      });
    } else if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword },
      });
    }

    // Invalidate outstanding password-reset OTPs for this email
    await prisma.emailOtp.updateMany({
      where: { email, purpose: "PASSWORD_RESET" },
      data: { consumedAt: new Date() },
    });

    return NextResponse.json({
      message: "Password updated successfully. You can sign in with your new password.",
    });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

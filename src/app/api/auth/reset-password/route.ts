import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prismadb";
import { normalizeEmail, verifySignupToken } from "@/lib/otp";
import { revokeAllMobileSessions } from "@/lib/mobile-auth";
import {
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
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

    const ip = getClientIp(request);
    const limited = await enforceRateLimits([
      { key: `reset-password:ip:${ip}`, limit: 10, windowSec: 60 * 60 },
    ]);
    if (limited) {
      return rateLimitResponse(limited);
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
      // Same generic success as a real update — do not leak account existence.
      return NextResponse.json({
        message:
          "Password updated successfully. You can sign in with your new password.",
      });
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
      await revokeAllMobileSessions(user.id);
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

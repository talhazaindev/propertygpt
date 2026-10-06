/**
 * Optional Resend email helper.
 * When RESEND_API_KEY is missing, sends are skipped cleanly so activation still works.
 */

type SendResult = { ok: true; skipped?: boolean; id?: string } | { ok: false; error: string };

async function sendViaResend(payload: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Manzil <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[email] RESEND_API_KEY not set — skipping email send", {
      to: payload.to,
      subject: payload.subject,
    });
    return { ok: true, skipped: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[email] Resend error", data);
      return { ok: false, error: data?.message || "Failed to send email" };
    }

    return { ok: true, id: data.id };
  } catch (error) {
    console.error("[email] send failed", error);
    return { ok: false, error: error instanceof Error ? error.message : "Send failed" };
  }
}

export async function sendAgentActivationEmail(params: {
  to: string;
  name: string;
  businessName: string;
}): Promise<SendResult> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const loginUrl = `${baseUrl}/login?callbackUrl=${encodeURIComponent("/agent/dashboard")}`;

  return sendViaResend({
    to: params.to,
    subject: "Your Manzil agent account is active",
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="font-size: 24px;">Welcome to the Manzil agent network</h1>
        <p>Hi ${params.name},</p>
        <p>
          Your application for <strong>${params.businessName}</strong> has been approved.
          You can now sign in and access your agent dashboard.
        </p>
        <p>
          <a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#1a3a2a;color:#fff;text-decoration:none;border-radius:6px;">
            Sign in to your agent account
          </a>
        </p>
        <p style="color:#666;font-size:14px;">If you did not apply, you can ignore this email.</p>
      </div>
    `,
  });
}

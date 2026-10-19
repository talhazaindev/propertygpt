/**
 * Resend email helper.
 * Activation / welcome emails skip cleanly when RESEND_API_KEY is missing.
 * OTP emails must send — they fail if the key is missing.
 */

type SendResult = { ok: true; skipped?: boolean; id?: string } | { ok: false; error: string };

function getAppBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function brandedEmailShell(params: {
  title: string;
  preheader: string;
  bodyHtml: string;
}): string {
  const baseUrl = getAppBaseUrl();
  const logoUrl = `${baseUrl}/images/logo-nav.jpeg`;
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(params.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e0d4;">
          <tr>
            <td style="background:#1a3a2a;padding:28px 32px;text-align:center;">
              <img src="${logoUrl}" alt="Manzil By AlWahabCo" width="160" style="display:inline-block;max-width:160px;height:auto;border:0;" />
              <p style="margin:12px 0 0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#c9d7cf;">
                Manzil By AlWahabCo
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${params.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #eee7db;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#7a7468;">
                © ${year} Manzil By AlWahabCo. Verified property in Pakistan.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#7a7468;">
                <a href="${baseUrl}" style="color:#1a3a2a;text-decoration:none;">Visit Manzil</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

function perkListHtml(perks: string[]): string {
  const items = perks
    .map(
      (perk) => `
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#1a3a2a;font-weight:bold;">✓</td>
        <td style="padding:8px 0;font-size:15px;line-height:1.5;color:#2a2a2a;">${escapeHtml(perk)}</td>
      </tr>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;">
      ${items}
    </table>
  `;
}

function ctaButtonHtml(href: string, label: string): string {
  return `
    <p style="margin:28px 0 8px;text-align:center;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;background:#1a3a2a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:bold;">
        ${escapeHtml(label)}
      </a>
    </p>
  `;
}

async function sendViaResend(
  payload: {
    to: string;
    subject: string;
    html: string;
  },
  options?: { required?: boolean }
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Manzil <onboarding@resend.dev>";

  if (!apiKey) {
    if (options?.required) {
      console.error("[email] RESEND_API_KEY not set — cannot send required email", {
        to: payload.to,
        subject: payload.subject,
      });
      return { ok: false, error: "Email service is not configured" };
    }
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
  const baseUrl = getAppBaseUrl();
  const loginUrl = `${baseUrl}/login?callbackUrl=${encodeURIComponent("/agent/dashboard")}`;
  const safeName = escapeHtml(params.name);
  const safeBusiness = escapeHtml(params.businessName);

  return sendViaResend({
    to: params.to,
    subject: "Your Manzil agent account is active",
    html: brandedEmailShell({
      title: "Agent account active",
      preheader: "Your Manzil agent application was approved.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#1a3a2a;">Welcome to the Manzil agent network</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
          Your application for <strong>${safeBusiness}</strong> has been approved.
          You can now sign in and access your agent dashboard.
        </p>
        ${ctaButtonHtml(loginUrl, "Sign in to your agent account")}
        <p style="margin:20px 0 0;font-size:13px;color:#7a7468;">If you did not apply, you can ignore this email.</p>
      `,
    }),
  });
}

export async function sendBuyerWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<SendResult> {
  const baseUrl = getAppBaseUrl();
  const loginUrl = `${baseUrl}/login`;
  const propertiesUrl = `${baseUrl}/properties`;
  const safeName = escapeHtml(params.name || "there");

  return sendViaResend({
    to: params.to,
    subject: "Welcome to Manzil — verified property starts here",
    html: brandedEmailShell({
      title: "Welcome to Manzil",
      preheader: "Your account is ready. Browse verified listings with confidence.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#1a3a2a;">Welcome to Manzil</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
          Your email is verified and your account is ready. Manzil is Pakistan’s trust-first
          property marketplace — every listing checked before it reaches you.
        </p>
        <p style="margin:20px 0 0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#1a3a2a;font-weight:bold;">
          What you get as a Manzil member
        </p>
        ${perkListHtml([
          "Browse title-checked, Manzil Verified listings",
          "Clear ownership and society-dues checks before you commit",
          "Request verification for a property you are considering",
          "Sell with confidence — we verify before buyers see your home",
          "Dedicated advisors through viewing to final registry",
        ])}
        ${ctaButtonHtml(propertiesUrl, "Browse verified listings")}
        <p style="margin:8px 0 0;text-align:center;font-size:14px;">
          <a href="${loginUrl}" style="color:#1a3a2a;">Or sign in to your account</a>
        </p>
      `,
    }),
  });
}

export async function sendAgentApplicationWelcomeEmail(params: {
  to: string;
  name: string;
  businessName: string;
}): Promise<SendResult> {
  const baseUrl = getAppBaseUrl();
  const safeName = escapeHtml(params.name || "there");
  const safeBusiness = escapeHtml(params.businessName);

  return sendViaResend({
    to: params.to,
    subject: "We received your Manzil agent application",
    html: brandedEmailShell({
      title: "Agent application received",
      preheader: "Thanks for applying. Your email is verified and our team will review next.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#1a3a2a;">Application received</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
          Thanks for applying to join the Manzil agent network for
          <strong>${safeBusiness}</strong>. Your email is verified. Our team will review your
          details and email you once your account is approved.
        </p>
        <p style="margin:20px 0 0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#1a3a2a;font-weight:bold;">
          Partner perks after approval
        </p>
        ${perkListHtml([
          "Public Agent Trust Profile clients can actually rely on",
          "Access to Manzil buyers and verified inventory",
          "Commission on verifications, referrals, and closed deals",
          "Monthly targets with bonuses for top performers",
          "Golden Agent path with dedicated Manzil support",
          "Stay the owner of your business under Manzil’s trust umbrella",
        ])}
        ${ctaButtonHtml(baseUrl, "Visit Manzil")}
        <p style="margin:20px 0 0;font-size:13px;color:#7a7468;">
          You will get a separate activation email when your account is ready to sign in.
        </p>
      `,
    }),
  });
}

function propertySummaryHtml(params: {
  title: string;
  address?: string | null;
  price?: number | null;
}): string {
  const rows: string[] = [
    `<tr><td style="padding:4px 0;color:#7a7468;width:90px;">Listing</td><td style="padding:4px 0;color:#1a1a1a;"><strong>${escapeHtml(params.title)}</strong></td></tr>`,
  ];
  if (params.address) {
    rows.push(
      `<tr><td style="padding:4px 0;color:#7a7468;">Address</td><td style="padding:4px 0;color:#1a1a1a;">${escapeHtml(params.address)}</td></tr>`
    );
  }
  if (typeof params.price === "number" && Number.isFinite(params.price)) {
    rows.push(
      `<tr><td style="padding:4px 0;color:#7a7468;">Price</td><td style="padding:4px 0;color:#1a1a1a;">PKR ${params.price.toLocaleString("en-PK")}</td></tr>`
    );
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;padding:16px;background:#f8f5ef;border-radius:8px;">${rows.join("")}</table>`;
}

/** Owner: listing submitted and awaiting Manzil verification. */
export async function sendPropertySubmittedEmail(params: {
  to: string;
  name: string;
  propertyId: string;
  title: string;
  address?: string | null;
  price?: number | null;
}): Promise<SendResult> {
  const baseUrl = getAppBaseUrl();
  const propertyUrl = `${baseUrl}/properties/${params.propertyId}`;
  const safeName = escapeHtml(params.name || "there");

  return sendViaResend({
    to: params.to,
    subject: `We received your listing: ${params.title}`,
    html: brandedEmailShell({
      title: "Listing submitted",
      preheader: "Your property was submitted for Manzil verification.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#1a3a2a;">Listing submitted for verification</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
          Thank you for listing with Manzil. Your property has been submitted and is now in our
          verification queue. We will review the title, documents, and details before it goes live.
        </p>
        ${propertySummaryHtml(params)}
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#2a2a2a;">
          You will get another email as soon as verification is complete.
        </p>
        ${ctaButtonHtml(propertyUrl, "View your listing")}
      `,
    }),
  });
}

/** Owner: listing verified / live. */
export async function sendPropertyVerifiedEmail(params: {
  to: string;
  name: string;
  propertyId: string;
  title: string;
  address?: string | null;
  price?: number | null;
}): Promise<SendResult> {
  const baseUrl = getAppBaseUrl();
  const propertyUrl = `${baseUrl}/properties/${params.propertyId}`;
  const safeName = escapeHtml(params.name || "there");

  return sendViaResend({
    to: params.to,
    subject: `Verified: ${params.title} is live on Manzil`,
    html: brandedEmailShell({
      title: "Listing verified",
      preheader: "Your property passed Manzil verification and is now live.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#1a3a2a;">Your listing is verified</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
          Great news — your property passed Manzil verification and is now visible to buyers
          with the Manzil Verified badge.
        </p>
        ${propertySummaryHtml(params)}
        ${ctaButtonHtml(propertyUrl, "View live listing")}
      `,
    }),
  });
}

/** Agent: new verification lead assigned. */
export async function sendAgentVerificationLeadEmail(params: {
  to: string;
  name: string;
  propertyId: string;
  title: string;
  address?: string | null;
  price?: number | null;
  businessName?: string | null;
}): Promise<SendResult> {
  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}/login?callbackUrl=${encodeURIComponent("/agent/dashboard")}`;
  const safeName = escapeHtml(params.name || "there");
  const businessLine = params.businessName
    ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#2a2a2a;">Assigned to <strong>${escapeHtml(params.businessName)}</strong>.</p>`
    : "";

  return sendViaResend({
    to: params.to,
    subject: `New verification lead: ${params.title}`,
    html: brandedEmailShell({
      title: "New verification lead",
      preheader: "You have a new property verification assignment on Manzil.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#1a3a2a;">New verification lead</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
          You have been assigned a new property to verify. Please review the listing details,
          complete your checks, and submit your verification report from your agent dashboard.
        </p>
        ${businessLine}
        ${propertySummaryHtml(params)}
        ${ctaButtonHtml(dashboardUrl, "Open agent dashboard")}
      `,
    }),
  });
}

/** Agent: admin approved their verification work. */
export async function sendAgentVerificationSuccessEmail(params: {
  to: string;
  name: string;
  propertyId: string;
  title: string;
  address?: string | null;
  price?: number | null;
}): Promise<SendResult> {
  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}/login?callbackUrl=${encodeURIComponent("/agent/dashboard")}`;
  const propertyUrl = `${baseUrl}/properties/${params.propertyId}`;
  const safeName = escapeHtml(params.name || "there");

  return sendViaResend({
    to: params.to,
    subject: `Verification approved: ${params.title}`,
    html: brandedEmailShell({
      title: "Verification approved",
      preheader: "Manzil approved your property verification work.",
      bodyHtml: `
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#1a3a2a;">Verification approved</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
          Excellent work — Manzil has approved your verification for this listing. It now
          counts toward your verified listings and Trust Score progress.
        </p>
        ${propertySummaryHtml(params)}
        ${ctaButtonHtml(dashboardUrl, "View agent dashboard")}
        <p style="margin:8px 0 0;text-align:center;font-size:14px;">
          <a href="${propertyUrl}" style="color:#1a3a2a;">Open live listing</a>
        </p>
      `,
    }),
  });
}

export async function sendSignupOtpEmail(params: {
  to: string;
  code: string;
  purpose: "SIGNUP" | "AGENT_SIGNUP";
  expiresInMinutes: number;
}): Promise<SendResult> {
  const isAgent = params.purpose === "AGENT_SIGNUP";
  const heading = isAgent
    ? "Verify your agent application email"
    : "Verify your Manzil account email";
  const context = isAgent
    ? "Use this code to finish your Manzil agent application."
    : "Use this code to finish creating your Manzil account.";

  return sendViaResend(
    {
      to: params.to,
      subject: `${params.code} is your Manzil verification code`,
      html: brandedEmailShell({
        title: "Email verification",
        preheader: `Your Manzil verification code is ${params.code}`,
        bodyHtml: `
          <h1 style="margin:0 0 12px;font-size:26px;line-height:1.3;color:#1a3a2a;">${heading}</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">${context}</p>
          <p style="margin:28px 0;font-size:36px;letter-spacing:10px;font-weight:bold;text-align:center;color:#1a3a2a;">
            ${escapeHtml(params.code)}
          </p>
          <p style="margin:0;font-size:13px;color:#7a7468;text-align:center;">
            This code expires in ${params.expiresInMinutes} minutes. If you did not request it, you can ignore this email.
          </p>
        `,
      }),
    },
    { required: true }
  );
}

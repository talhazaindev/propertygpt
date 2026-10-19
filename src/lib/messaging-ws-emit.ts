/**
 * Optional notify to a Socket.IO companion process.
 * No-op unless MESSAGING_WS_INTERNAL_URL is explicitly configured.
 * Primary live updates on Vercel use HTTP polling.
 */

export async function emitMessagingEvent(
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const base = process.env.MESSAGING_WS_INTERNAL_URL?.trim();
  if (!base) {
    return;
  }

  const secret =
    process.env.MESSAGING_WS_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-ws-secret";

  try {
    await fetch(`${base.replace(/\/$/, "")}/internal/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ws-secret": secret,
      },
      body: JSON.stringify({ event, payload }),
    });
  } catch (error) {
    console.warn("[messaging-ws-emit] failed (optional ws offline)", error);
  }
}

/** Optional transactional email (Resend). Falls back to console + returned URL. */

export async function sendAppEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ||
    "PulseFlow <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[email] RESEND_API_KEY not set; skipping send", {
      to: input.to,
      subject: input.subject,
    });
    return { sent: false, error: "Email provider not configured." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn("[email] Resend failed", res.status, body);
      return { sent: false, error: body || `HTTP ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed";
    console.warn("[email] send error", message);
    return { sent: false, error: message };
  }
}

export function appOriginFromRequest(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

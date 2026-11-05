import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isServicesRequest,
  safeConfirmNext,
  sendRegistrationConfirm,
} from "@/lib/auth/confirm-email";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const rl = rateLimit(`resend-confirm:${clientIp(request)}`, {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  let body: { email?: string; locale?: string; next?: string };
  try {
    body = (await request.json()) as { email?: string; locale?: string; next?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (!profile?.id) {
    return NextResponse.json({ ok: true });
  }

  const { data: userData } = await admin.auth.admin.getUserById(profile.id);
  if (userData.user?.email_confirmed_at) {
    return NextResponse.json({ ok: true, confirmed: true });
  }

  const marketplace = isServicesRequest(request);
  const mail = await sendRegistrationConfirm(admin, request, {
    email,
    locale: body.locale,
    nextPath: safeConfirmNext(body.next, marketplace),
  });
  if (!mail.sent) {
    return NextResponse.json(
      { error: "Could not send the confirmation email. Try again in a moment." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true });
}

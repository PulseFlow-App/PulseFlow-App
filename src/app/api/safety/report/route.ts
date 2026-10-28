import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/design-tokens";
import { isDemoMode } from "@/lib/env";

export const runtime = "nodejs";

/** Report a message / user for moderation (Apple 1.2 / Play UGC). */
export async function POST(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json({
      ok: true,
      demo: true,
      supportEmail: brand.supportEmail,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: {
    targetProfileId?: string;
    messageId?: string | null;
    channel?: string | null;
    reason?: string;
    details?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const targetProfileId = body.targetProfileId?.trim();
  if (!targetProfileId) {
    return NextResponse.json({ error: "Missing target." }, { status: 400 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.org_id) {
    return NextResponse.json({ error: "Profile missing." }, { status: 400 });
  }

  const reason = (body.reason ?? "abuse").slice(0, 80);
  const details = (body.details ?? "").slice(0, 2000) || null;

  const { error } = await supabase.from("content_reports").insert({
    org_id: me.org_id,
    reporter_id: user.id,
    target_profile_id: targetProfileId,
    message_id: body.messageId ?? null,
    channel: body.channel ?? null,
    reason,
    details,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    supportEmail: brand.supportEmail,
  });
}

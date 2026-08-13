import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Ctx) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not available in demo mode." }, { status: 400 });
  }

  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: invite, error } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .maybeSingle();

  if (error || !invite) {
    return NextResponse.json({ invite: null, org: null, inviter: null });
  }

  const [{ data: org }, { data: inviter }] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, kind, created_at")
      .eq("id", invite.org_id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id, full_name, role, email, org_id, personal_org_id, phone, job_title, share_slug")
      .eq("id", invite.created_by)
      .maybeSingle(),
  ]);

  return NextResponse.json({ invite, org, inviter });
}

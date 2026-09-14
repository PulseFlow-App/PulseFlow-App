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
      .select("id, full_name, role, job_title")
      .eq("id", invite.created_by)
      .maybeSingle(),
  ]);

  // Do not leak invitee PII or unused invite row fields to anonymous clients.
  return NextResponse.json({
    invite: {
      id: invite.id,
      org_id: invite.org_id,
      role: invite.role,
      job_title: invite.job_title,
      token: invite.token,
      email: invite.email ?? null,
      full_name: invite.full_name ?? null,
    },
    org,
    inviter,
  });
}

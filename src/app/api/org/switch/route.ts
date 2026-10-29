import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { ensureOrgMembership } from "@/lib/auth/attach-org";
import type { UserRole } from "@/lib/design-tokens";

export const runtime = "nodejs";

const bodySchema = z.object({
  orgId: z.string().uuid(),
});

/**
 * Switch the signed-in user's active workspace (profiles.org_id + role).
 * Uses service role because migration 059 blocks client updates of those columns.
 */
export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Workspace switch requires Supabase." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, org_id, personal_org_id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const { data: org } = await admin
    .from("organizations")
    .select("id, kind, name")
    .eq("id", body.orgId)
    .maybeSingle();
  if (!org) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  let nextRole: UserRole = profile.role as UserRole;

  if (org.kind === "personal") {
    if (profile.personal_org_id !== org.id && profile.org_id !== org.id) {
      return NextResponse.json(
        { error: "That personal workspace is not yours." },
        { status: 403 },
      );
    }
    nextRole = "owner";
  } else {
    const { data: membership } = await admin
      .from("org_memberships")
      .select("role")
      .eq("org_id", org.id)
      .eq("profile_id", user.id)
      .maybeSingle();

    const isPrimary = profile.org_id === org.id;
    if (!membership && !isPrimary) {
      return NextResponse.json(
        { error: "You are not a member of that company." },
        { status: 403 },
      );
    }
    nextRole = (membership?.role ?? profile.role) as UserRole;
    if (nextRole === "guest") {
      // Guests stay on their invite org; switching between companies is for team.
      return NextResponse.json(
        { error: "Guests cannot switch company workspaces." },
        { status: 403 },
      );
    }
    await ensureOrgMembership(admin, {
      orgId: org.id,
      profileId: user.id,
      role: nextRole,
    });
  }

  // Keep personal_org_id stable; only change active org + role for that workspace.
  const { error } = await admin
    .from("profiles")
    .update({ org_id: org.id, role: nextRole })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    orgId: org.id,
    orgName: org.name,
    orgKind: org.kind,
    role: nextRole,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { rankRole } from "@/lib/auth/attach-org";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  profileId: z.string().uuid(),
  orgId: z.string().uuid().optional(),
});

/**
 * Remove a teammate from the active (or given) company workspace.
 * Deletes membership + villa assignments; does not delete their account or personal pocket.
 */
export async function POST(request: Request) {
  const rl = rateLimit(`org-remove-member:${clientIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Removing members requires a live workspace." },
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

  if (body.profileId === user.id) {
    return NextResponse.json(
      { error: "You cannot remove yourself. Switch workspace or leave from Settings." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: actor } = await admin
    .from("profiles")
    .select("id, org_id, role, personal_org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!actor) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const orgId = body.orgId ?? actor.org_id;
  const { data: org } = await admin
    .from("organizations")
    .select("id, kind")
    .eq("id", orgId)
    .maybeSingle();
  if (!org || org.kind !== "company") {
    return NextResponse.json(
      { error: "Only company workspaces have removable members." },
      { status: 400 },
    );
  }

  const { data: actorMem } = await admin
    .from("org_memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("profile_id", user.id)
    .maybeSingle();
  const actorRole =
    actorMem?.role ?? (actor.org_id === orgId ? actor.role : null);
  if (actorRole !== "owner" && actorRole !== "manager") {
    return NextResponse.json(
      { error: "Only owners or managers can remove teammates." },
      { status: 403 },
    );
  }

  const { data: target } = await admin
    .from("profiles")
    .select("id, org_id, role, personal_org_id, full_name")
    .eq("id", body.profileId)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  const { data: targetMem } = await admin
    .from("org_memberships")
    .select("id, role")
    .eq("org_id", orgId)
    .eq("profile_id", target.id)
    .maybeSingle();
  const targetInOrg =
    Boolean(targetMem) || target.org_id === orgId;
  if (!targetInOrg) {
    return NextResponse.json(
      { error: "That person is not in this company." },
      { status: 404 },
    );
  }

  const targetRole = (targetMem?.role ?? target.role) as string;
  if (targetRole === "owner") {
    return NextResponse.json(
      { error: "Cannot remove the company owner." },
      { status: 403 },
    );
  }
  if (actorRole === "manager" && rankRole(targetRole) >= rankRole("manager")) {
    return NextResponse.json(
      { error: "Managers can only remove staff or cleaners." },
      { status: 403 },
    );
  }

  if (targetMem?.id) {
    const { error } = await admin
      .from("org_memberships")
      .delete()
      .eq("id", targetMem.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  await admin
    .from("villa_assignments")
    .delete()
    .eq("org_id", orgId)
    .eq("profile_id", target.id);

  // If their active workspace was this company, move them to personal (or leave org_id).
  if (target.org_id === orgId) {
    let nextOrgId = target.personal_org_id as string | null;
    if (!nextOrgId) {
      const { data: otherMem } = await admin
        .from("org_memberships")
        .select("org_id, role")
        .eq("profile_id", target.id)
        .order("joined_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      nextOrgId = otherMem?.org_id ?? null;
      if (nextOrgId) {
        await admin
          .from("profiles")
          .update({
            org_id: nextOrgId,
            role: otherMem?.role ?? "staff",
          })
          .eq("id", target.id);
      }
    } else {
      await admin
        .from("profiles")
        .update({ org_id: nextOrgId, role: "owner" })
        .eq("id", target.id);
    }
  }

  await admin.from("notifications").insert({
    org_id: orgId,
    kind: "team_joined",
    title: "Removed from company",
    body: `You were removed from a company workspace on Pulse Flow.`,
    href: "/settings",
    entity_id: orgId,
    audience_profile_ids: [target.id],
  });

  return NextResponse.json({
    ok: true,
    removedProfileId: target.id,
    name: target.full_name,
  });
}

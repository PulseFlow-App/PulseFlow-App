import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import {
  ensureOrgMembership,
  pickPrimaryRole,
} from "@/lib/auth/attach-org";
import { companyTrialEndsAt } from "@/lib/auth/helpers";
import { ensureStaffContact } from "@/lib/contacts/ensure-staff-contact";
import { moveVillasToOrg } from "@/lib/handoff/move-villas-to-org";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

const bodySchema = z.object({
  /** Required when handoff.create_company is false and target_org_id was not set. */
  orgId: z.string().uuid().optional(),
});

/**
 * Accept a property handoff: create/attach company, move villas, set roles.
 */
export async function POST(request: Request, context: Ctx) {
  const rl = rateLimit(`handoff-accept:${clientIp(request)}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Handoff requires a live workspace." },
      { status: 400 },
    );
  }

  const { token } = await context.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to accept." }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema> = {};
  try {
    const raw = await request.json().catch(() => ({}));
    body = bodySchema.parse(raw ?? {});
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: handoff } = await admin
    .from("property_handoffs")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!handoff) {
    return NextResponse.json({ error: "Handoff not found." }, { status: 404 });
  }
  if (handoff.status !== "pending") {
    return NextResponse.json(
      { error: `This handoff is already ${handoff.status}.` },
      { status: 409 },
    );
  }

  const { data: acceptor } = await admin
    .from("profiles")
    .select(
      "id, org_id, personal_org_id, role, full_name, email, phone, job_title, job_search_skills",
    )
    .eq("id", user.id)
    .maybeSingle();
  if (!acceptor) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const expected = String(handoff.to_email).trim().toLowerCase();
  const actual = String(acceptor.email ?? "").trim().toLowerCase();
  if (expected !== actual) {
    return NextResponse.json(
      {
        error: `Sign in with ${handoff.to_email} to accept this handoff.`,
      },
      { status: 403 },
    );
  }

  if (acceptor.id === handoff.from_profile_id) {
    return NextResponse.json(
      { error: "You cannot accept your own handoff." },
      { status: 400 },
    );
  }

  const { data: manager } = await admin
    .from("profiles")
    .select(
      "id, org_id, personal_org_id, role, full_name, phone, job_title, job_search_skills, email",
    )
    .eq("id", handoff.from_profile_id)
    .maybeSingle();
  if (!manager) {
    return NextResponse.json(
      { error: "Inviter profile missing." },
      { status: 400 },
    );
  }

  let companyId: string;

  if (handoff.create_company) {
    const name = String(handoff.company_name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "Company name missing on this invite." },
        { status: 400 },
      );
    }
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({
        name,
        kind: "company",
        trial_ends_at: companyTrialEndsAt(),
        subscription_status: "trialing",
        billing_email: acceptor.email,
      })
      .select("id")
      .single();
    if (orgErr || !org) {
      return NextResponse.json(
        { error: orgErr?.message ?? "Could not create company." },
        { status: 500 },
      );
    }
    companyId = org.id;
  } else {
    const candidateId =
      body.orgId ?? (handoff.target_org_id as string | null) ?? null;
    if (!candidateId) {
      return NextResponse.json(
        {
          error:
            "Choose which of your companies should receive these properties.",
          needsOrgChoice: true,
        },
        { status: 400 },
      );
    }
    const { data: org } = await admin
      .from("organizations")
      .select("id, kind, name")
      .eq("id", candidateId)
      .maybeSingle();
    if (!org || org.kind !== "company") {
      return NextResponse.json(
        { error: "Target must be a company workspace." },
        { status: 400 },
      );
    }

    // Acceptor must already be owner of that company (membership or primary).
    const { data: mem } = await admin
      .from("org_memberships")
      .select("role")
      .eq("org_id", org.id)
      .eq("profile_id", acceptor.id)
      .maybeSingle();
    const roleThere =
      mem?.role ??
      (acceptor.org_id === org.id ? acceptor.role : null);
    if (roleThere !== "owner") {
      return NextResponse.json(
        {
          error:
            "Only the company owner can accept properties into that workspace.",
        },
        { status: 403 },
      );
    }
    companyId = org.id;
  }

  try {
    await moveVillasToOrg(admin, {
      villaIds: handoff.villa_ids as string[],
      fromOrgId: handoff.personal_org_id as string,
      toOrgId: companyId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not move properties." },
      { status: 500 },
    );
  }

  await ensureOrgMembership(admin, {
    orgId: companyId,
    profileId: acceptor.id,
    role: "owner",
  });
  await ensureOrgMembership(admin, {
    orgId: companyId,
    profileId: manager.id,
    role: "manager",
  });

  const ownerRole = pickPrimaryRole(String(acceptor.role), "owner");
  const { error: ownerUpdErr } = await admin
    .from("profiles")
    .update({ org_id: companyId, role: ownerRole })
    .eq("id", acceptor.id);
  if (ownerUpdErr) {
    return NextResponse.json({ error: ownerUpdErr.message }, { status: 500 });
  }

  // Switch manager into the company as manager so ops continue after handoff.
  // Membership holds the per-company role; profiles.role matches the active org.
  await admin
    .from("profiles")
    .update({ org_id: companyId, role: "manager" })
    .eq("id", manager.id);

  try {
    await ensureStaffContact(admin, {
      orgId: companyId,
      profile: {
        id: manager.id,
        full_name: manager.full_name,
        phone: manager.phone,
        job_title: manager.job_title,
        role: "manager",
        job_search_skills: manager.job_search_skills,
      },
    });
  } catch (e) {
    console.warn("ensureStaffContact on handoff failed", e);
  }

  const now = new Date().toISOString();
  const { error: handoffUpdErr } = await admin
    .from("property_handoffs")
    .update({
      status: "accepted",
      accepted_at: now,
      accepted_by: acceptor.id,
      resulting_org_id: companyId,
      target_org_id: companyId,
    })
    .eq("id", handoff.id)
    .eq("status", "pending");
  if (handoffUpdErr) {
    return NextResponse.json({ error: handoffUpdErr.message }, { status: 500 });
  }

  await admin.from("notifications").insert([
    {
      org_id: companyId,
      kind: "team_joined",
      title: "Properties handed over",
      body: `${acceptor.full_name} accepted your property handoff.`,
      href: "/villas",
      entity_id: handoff.id,
      audience_profile_ids: [manager.id],
    },
    {
      org_id: companyId,
      kind: "team_joined",
      title: "You own these properties now",
      body: `${manager.full_name} handed properties into your company. You are the owner; they stay as manager.`,
      href: "/villas",
      entity_id: handoff.id,
      audience_profile_ids: [acceptor.id],
    },
  ]);

  return NextResponse.json({
    ok: true,
    orgId: companyId,
    villaCount: (handoff.villa_ids as string[]).length,
  });
}

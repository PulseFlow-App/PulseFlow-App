import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { companyTrialEndsAt } from "@/lib/auth/helpers";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

const bodySchema = z.object({
  role: z.enum(["owner", "manager"]),
  companyName: z.string().trim().min(1).max(120).optional(),
});

/**
 * Convert the signed-in user's active personal workspace into a company.
 * Properties stay on the same org. A fresh empty personal org is created
 * for side work. Seat: owner (you pay) or manager (invite owner who pays).
 */
export async function POST(request: Request) {
  const rl = rateLimit(`upgrade-company:${clientIp(request)}`, {
    limit: 6,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Upgrade requires Supabase." },
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
    return NextResponse.json(
      { error: "Choose Owner or Manager, and an optional company name." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, org_id, personal_org_id, role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: org } = await admin
    .from("organizations")
    .select("id, kind, name")
    .eq("id", profile.org_id)
    .maybeSingle();
  if (!org || org.kind !== "personal") {
    return NextResponse.json(
      { error: "Switch to your personal workspace first, then upgrade." },
      { status: 400 },
    );
  }

  const email = String(profile.email ?? user.email ?? "").toLowerCase();
  const companyName =
    body.companyName?.trim() ||
    String(org.name).replace(/\s*'s properties$/i, "").trim() ||
    `${String(profile.full_name).split(" ")[0] || "My"} company`;

  const { data: personalOrg, error: personalErr } = await admin
    .from("organizations")
    .insert({
      name: `${String(profile.full_name).split(" ")[0] || "My"}'s personal ops`,
      kind: "personal",
      subscription_status: "none",
    })
    .select("id")
    .single();
  if (personalErr || !personalOrg) {
    return NextResponse.json(
      { error: personalErr?.message ?? "Could not create personal workspace." },
      { status: 500 },
    );
  }

  const { error: orgErr } = await admin
    .from("organizations")
    .update({
      kind: "company",
      name: companyName,
      trial_ends_at: companyTrialEndsAt(),
      subscription_status: "trialing",
      billing_email: email || null,
    })
    .eq("id", org.id);
  if (orgErr) {
    await admin.from("organizations").delete().eq("id", personalOrg.id);
    return NextResponse.json({ error: orgErr.message }, { status: 500 });
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      role: body.role,
      job_title: body.role === "manager" ? "Manager" : "Owner",
      personal_org_id: personalOrg.id,
    })
    .eq("id", user.id);
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  const { data: existingMem } = await admin
    .from("org_memberships")
    .select("id")
    .eq("org_id", org.id)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existingMem) {
    await admin
      .from("org_memberships")
      .update({ role: body.role })
      .eq("id", existingMem.id);
  } else {
    await admin.from("org_memberships").insert({
      org_id: org.id,
      profile_id: user.id,
      role: body.role,
    });
  }

  return NextResponse.json({
    ok: true,
    orgId: org.id,
    personalOrgId: personalOrg.id,
    role: body.role,
    trialEndsAt: companyTrialEndsAt(),
  });
}

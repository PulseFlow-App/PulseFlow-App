import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  companyTrialEndsAt,
  slugifyName,
  uniqueShareSlug,
  type RegisterWorkspaceInput,
} from "@/lib/auth/helpers";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";

export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Registration requires Supabase (set DEMO_MODE=false)." },
      { status: 400 },
    );
  }

  let body: RegisterWorkspaceInput;
  try {
    body = (await request.json()) as RegisterWorkspaceInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const orgName = body.orgName?.trim() ?? "";
  const phone = body.phone?.trim() || null;
  const kind = body.kind;
  const role = body.role;

  if (!fullName || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Name, email, and a password (6+ chars) are required." },
      { status: 400 },
    );
  }
  if (kind !== "personal" && kind !== "company") {
    return NextResponse.json({ error: "Invalid organization kind." }, { status: 400 });
  }
  // Public register: personal solo workspace, or company owner only.
  // Staff / managers join via invite (/join/[token]).
  if (kind === "company" && !orgName) {
    return NextResponse.json(
      { error: "Company name is required." },
      { status: 400 },
    );
  }
  if (role && role !== "owner") {
    return NextResponse.json(
      {
        error:
          "Register as a company owner, or choose Personal use. Team members join with an invite link.",
      },
      { status: 400 },
    );
  }

  const resolvedRole = "owner" as const;

  const admin = createAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr || !created.user) {
    return NextResponse.json(
      { error: createErr?.message ?? "Could not create user." },
      { status: 400 },
    );
  }

  const userId = created.user.id;
  const workspaceName =
    orgName ||
    (kind === "personal"
      ? `${fullName.split(" ")[0]}'s properties`
      : fullName);

  const isCompany = kind === "company";
  const orgRow = {
    name: workspaceName,
    kind,
    trial_ends_at: isCompany ? companyTrialEndsAt() : null,
    subscription_status: isCompany ? "trialing" : "none",
    billing_email: isCompany ? email : null,
  };

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert(orgRow)
    .select("id")
    .single();

  if (orgErr || !org) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: orgErr?.message ?? "Could not create organization." },
      { status: 500 },
    );
  }

  const share_slug = await uniqueShareSlug(slugifyName(fullName), async (slug) => {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("share_slug", slug)
      .maybeSingle();
    return Boolean(data);
  });

  const personal_org_id = kind === "personal" ? org.id : null;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    org_id: org.id,
    personal_org_id,
    role: resolvedRole,
    full_name: fullName,
    phone,
    email,
    job_title: kind === "personal" ? "Personal" : "Owner",
    share_slug,
  });

  if (profileErr) {
    await admin.from("organizations").delete().eq("id", org.id);
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: profileErr.message },
      { status: 500 },
    );
  }

  if (isCompany) {
    await admin.from("org_memberships").insert({
      org_id: org.id,
      profile_id: userId,
      role: resolvedRole,
    });
  }

  return NextResponse.json({ ok: true, orgId: org.id, userId });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfileShareSlug } from "@/lib/auth/share-slug";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";

type Body = {
  token: string;
  password: string;
};

export async function GET(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Unavailable in demo." }, { status: 400 });
  }
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("profile_merge_requests")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!row || row.status !== "pending") {
    return NextResponse.json(
      { error: "This merge link is invalid or already used." },
      { status: 404 },
    );
  }
  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    await admin
      .from("profile_merge_requests")
      .update({ status: "expired" })
      .eq("id", row.id);
    return NextResponse.json(
      { error: "This merge link has expired." },
      { status: 410 },
    );
  }

  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", row.org_id)
    .maybeSingle();

  return NextResponse.json({
    email: row.email,
    orgName: (org?.name as string | undefined) ?? "this company",
    fullName: row.full_name,
  });
}

export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Merge confirm requires Supabase." },
      { status: 400 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";
  if (!token || password.length < 6) {
    return NextResponse.json(
      { error: "Token and password are required." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("profile_merge_requests")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!row) {
    return NextResponse.json(
      { error: "This merge link is invalid or already used." },
      { status: 400 },
    );
  }

  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    await admin
      .from("profile_merge_requests")
      .update({ status: "expired" })
      .eq("id", row.id);
    return NextResponse.json(
      { error: "This merge link has expired." },
      { status: 410 },
    );
  }

  const email = (row.email as string).toLowerCase();
  const { createClient } = await import("@supabase/supabase-js");
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { error: pwErr } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (pwErr) {
    return NextResponse.json(
      { error: "Wrong password for this email." },
      { status: 400 },
    );
  }
  await anon.auth.signOut();

  const userId = row.profile_id as string;
  const orgId = row.org_id as string;
  const role = row.role as string;

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!existingProfile) {
    return NextResponse.json(
      { error: "Account is missing a profile." },
      { status: 400 },
    );
  }

  let personalOrgId = existingProfile.personal_org_id as string | null;
  if (!personalOrgId && existingProfile.org_id !== orgId) {
    personalOrgId = existingProfile.org_id;
  }

  const { data: membership } = await admin
    .from("org_memberships")
    .select("id")
    .eq("org_id", orgId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (!membership) {
    await admin.from("org_memberships").insert({
      org_id: orgId,
      profile_id: userId,
      role,
    });
  }

  await admin
    .from("profiles")
    .update({
      org_id: orgId,
      role,
      personal_org_id: personalOrgId,
      job_title: row.job_title ?? existingProfile.job_title,
      phone: row.phone ?? existingProfile.phone,
    })
    .eq("id", userId);

  await ensureProfileShareSlug(admin, {
    id: userId,
    full_name: existingProfile.full_name,
    share_slug: existingProfile.share_slug as string | null,
    role,
  });

  await admin
    .from("invites")
    .update({
      full_name: row.full_name ?? existingProfile.full_name,
      email,
      phone: row.phone,
      used_at: new Date().toISOString(),
      used_by: userId,
    })
    .eq("id", row.invite_id);

  await admin
    .from("profile_merge_requests")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  const { data: orgProfiles } = await admin
    .from("profiles")
    .select("id, role")
    .eq("org_id", orgId);
  const audience = (orgProfiles ?? [])
    .filter(
      (p) =>
        (p.role === "owner" || p.role === "manager") && p.id !== userId,
    )
    .map((p) => p.id);
  if (audience.length) {
    const note = {
      org_id: orgId,
      kind: "team_joined" as const,
      title: "Guest profile merged",
      body: `${existingProfile.full_name} joined as guest (merged profile)`,
      href: "/guests",
      entity_id: userId,
      audience_profile_ids: audience,
    };
    await admin.from("notifications").insert(note);
  }

  return NextResponse.json({ ok: true, email, userId });
}

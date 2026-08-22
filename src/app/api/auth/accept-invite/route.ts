import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyName, uniqueShareSlug } from "@/lib/auth/helpers";
import { creditReferral } from "@/lib/billing/referrals";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";

type Body = {
  token: string;
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  referredBy?: string | null;
};

export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Invite accept requires Supabase." },
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
  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const phone = body.phone?.trim() || null;

  if (!token || !fullName || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Token, name, email, and password (6+) are required." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: invite, error: inviteErr } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .maybeSingle();

  if (inviteErr || !invite) {
    return NextResponse.json(
      { error: "This invite link is invalid or already used." },
      { status: 400 },
    );
  }

  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existingAuth = listed?.users.find(
    (u) => u.email?.toLowerCase() === email,
  );

  let userId: string;

  if (existingAuth) {
    const { error: signCheck } = await admin.auth.signInWithPassword({
      email,
      password,
    });
    // Admin client may not support password check; verify via generateLink or update
    void signCheck;
    // Prefer: attempt password update only if we can verify - use auth.admin
    // We'll validate by creating a temporary anon sign-in from client instead.
    // Server-side: use getUserById + require client to have signed in for existing users.
    // Simpler path: for existing users, require they already authenticated.
    // Here we verify password with a short-lived anon client:
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error: pwErr } = await anon.auth.signInWithPassword({ email, password });
    if (pwErr) {
      return NextResponse.json(
        { error: "Wrong password for this email." },
        { status: 400 },
      );
    }
    await anon.auth.signOut();
    userId = existingAuth.id;

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
    if (!personalOrgId) {
      if (existingProfile.org_id !== invite.org_id) {
        personalOrgId = existingProfile.org_id;
      } else {
        const { data: personalOrg, error: pErr } = await admin
          .from("organizations")
          .insert({
            name: `${existingProfile.full_name.split(" ")[0]}'s personal ops`,
            kind: "personal",
            subscription_status: "none",
          })
          .select("id")
          .single();
        if (pErr || !personalOrg) {
          return NextResponse.json(
            { error: pErr?.message ?? "Could not create personal org." },
            { status: 500 },
          );
        }
        personalOrgId = personalOrg.id;
      }
    }

    const { data: membership } = await admin
      .from("org_memberships")
      .select("id")
      .eq("org_id", invite.org_id)
      .eq("profile_id", userId)
      .maybeSingle();

    if (!membership) {
      await admin.from("org_memberships").insert({
        org_id: invite.org_id,
        profile_id: userId,
        role: invite.role,
      });
    }

    await admin
      .from("profiles")
      .update({
        org_id: invite.org_id,
        role: invite.role,
        personal_org_id: personalOrgId,
        job_title: invite.job_title ?? existingProfile.job_title,
        phone: phone ?? existingProfile.phone,
      })
      .eq("id", userId);
  } else {
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
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
    userId = created.user.id;

    const { data: personalOrg, error: pErr } = await admin
      .from("organizations")
      .insert({
        name: `${fullName.split(" ")[0]}'s personal ops`,
        kind: "personal",
        subscription_status: "none",
      })
      .select("id")
      .single();

    if (pErr || !personalOrg) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: pErr?.message ?? "Could not create personal org." },
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

    const { error: profileErr } = await admin.from("profiles").insert({
      id: userId,
      org_id: invite.org_id,
      personal_org_id: personalOrg.id,
      role: invite.role,
      full_name: fullName,
      phone,
      email,
      job_title: invite.job_title,
      share_slug,
    });

    if (profileErr) {
      await admin.from("organizations").delete().eq("id", personalOrg.id);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    await admin.from("org_memberships").insert({
      org_id: invite.org_id,
      profile_id: userId,
      role: invite.role,
    });
  }

  await admin
    .from("invites")
    .update({
      full_name: fullName,
      email,
      phone,
      used_at: new Date().toISOString(),
      used_by: userId,
    })
    .eq("id", invite.id);

  try {
    await creditReferral(admin, {
      referrerCode: body.referredBy,
      referredProfileId: userId,
      source: "invite",
      fallbackReferrerId: invite.created_by as string,
    });
  } catch (e) {
    console.warn("referral credit failed", e);
  }

  return NextResponse.json({ ok: true, userId, email });
}

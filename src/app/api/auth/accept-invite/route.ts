import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyName, uniqueShareSlug } from "@/lib/auth/helpers";
import { ensureProfileShareSlug } from "@/lib/auth/share-slug";
import { attachInviteToExistingProfile } from "@/lib/auth/attach-org";
import { creditReferral } from "@/lib/billing/referrals";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { appOriginFromRequest, sendAppEmail } from "@/lib/email/send";
import { randomBytes } from "crypto";

type Body = {
  token: string;
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  referredBy?: string | null;
  joinWithSession?: boolean;
};

type Admin = ReturnType<typeof createAdminClient>;

async function findAuthUserByEmail(admin: Admin, email: string) {
  const normalized = email.toLowerCase();
  const getter = (
    admin.auth.admin as unknown as {
      getUserByEmail?: (
        email: string,
      ) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
    }
  ).getUserByEmail;
  if (typeof getter === "function") {
    const { data } = await getter.call(admin.auth.admin, normalized);
    if (data?.user) return data.user;
  }
  for (let page = 1; page <= 50; page += 1) {
    const { data: listed } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    const found = listed?.users.find(
      (u) => u.email?.toLowerCase() === normalized,
    );
    if (found) return found;
    if (!listed?.users.length || listed.users.length < 200) return null;
  }
  return null;
}

async function findExistingProfile(admin: Admin, email: string) {
  const { data } = await admin
    .from("profiles")
    .select("*")
    .ilike("email", email)
    .limit(1);
  return data?.[0] ?? null;
}

async function markInviteUsed(
  admin: Admin,
  invite: { id: string },
  input: {
    fullName: string;
    email: string;
    phone: string | null;
    userId: string;
  },
) {
  await admin
    .from("invites")
    .update({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      used_at: new Date().toISOString(),
      used_by: input.userId,
    })
    .eq("id", invite.id);
}

async function notifyTeamJoined(
  admin: Admin,
  input: {
    orgId: string;
    userId: string;
    fullName: string;
    role: string;
    merged: boolean;
  },
) {
  const { data: orgProfiles } = await admin
    .from("profiles")
    .select("id, role")
    .eq("org_id", input.orgId);
  const audience = (orgProfiles ?? [])
    .filter(
      (p) =>
        (p.role === "owner" || p.role === "manager") && p.id !== input.userId,
    )
    .map((p) => p.id);
  if (!audience.length) return;
  const note = {
    org_id: input.orgId,
    kind: "team_joined" as const,
    title: input.merged ? "Profile joined another company" : "New team member",
    body: input.merged
      ? `${input.fullName} added this company to their existing profile (${input.role})`
      : `${input.fullName} joined as ${input.role}`,
    href: input.role === "guest" ? "/guests" : "/settings",
    entity_id: input.userId,
    audience_profile_ids: audience,
  };
  await admin.from("notifications").insert(note);
  if (!input.merged) {
    try {
      const { sendWebPush } = await import("@/lib/push/web-push");
      await sendWebPush(note);
    } catch (e) {
      console.warn("team_joined push failed", e);
    }
  }
}

async function startMergeRequest(
  admin: Admin,
  request: Request,
  input: {
    invite: {
      id: string;
      org_id: string;
      role: string;
      job_title: string | null;
    };
    profileId: string;
    email: string;
    fullName: string;
    phone: string | null;
  },
) {
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", input.invite.org_id)
    .maybeSingle();
  const orgName = (org?.name as string | undefined) ?? "this company";

  const { data: existingPending } = await admin
    .from("profile_merge_requests")
    .select("*")
    .eq("invite_id", input.invite.id)
    .eq("status", "pending")
    .maybeSingle();

  let mergeToken =
    (existingPending?.token as string | undefined) ??
    randomBytes(24).toString("hex");

  if (existingPending) {
    await admin
      .from("profile_merge_requests")
      .update({
        email: input.email,
        full_name: input.fullName,
        phone: input.phone,
        job_title: input.invite.job_title,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", existingPending.id);
    mergeToken = existingPending.token as string;
  } else {
    const { error: mergeErr } = await admin.from("profile_merge_requests").insert({
      token: mergeToken,
      invite_id: input.invite.id,
      profile_id: input.profileId,
      org_id: input.invite.org_id,
      role: input.invite.role,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone,
      job_title: input.invite.job_title,
      status: "pending",
    });
    if (mergeErr) {
      throw new Error(
        mergeErr.message.includes("does not exist") ||
          mergeErr.code === "42P01" ||
          mergeErr.code === "PGRST205"
          ? "Profile merge needs migration 033 on Supabase."
          : mergeErr.message,
      );
    }
  }

  const origin = appOriginFromRequest(request);
  const mergeUrl = `${origin}/merge/${mergeToken}`;
  const roleLabel = input.invite.role === "guest" ? "guest" : "team member";
  const subject = `Add ${orgName} to your Pulse Flow account?`;
  const text = [
    `A Pulse Flow profile already exists for ${input.email}.`,
    ``,
    `${orgName} invited you as a ${roleLabel}. Confirm to add this company to your existing account — you keep both companies on one login.`,
    ``,
    `Open this link, then enter your password to confirm:`,
    mergeUrl,
    ``,
    `If you ignore this email, nothing changes.`,
  ].join("\n");
  const html = `
    <p>A Pulse Flow profile already exists for <strong>${input.email}</strong>.</p>
    <p><strong>${orgName}</strong> invited you as a ${roleLabel}. Confirm to add this company to your existing account. You keep both companies on one login.</p>
    <p><a href="${mergeUrl}">Confirm and add company</a> — you will need your password.</p>
    <p>If you do not open the link, this request is ignored.</p>
  `;

  const mail = await sendAppEmail({
    to: input.email,
    subject,
    html,
    text,
  });

  return { orgName, mergeUrl, mergeEmailSent: mail.sent };
}

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
  if (!token) {
    return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
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

  if (body.joinWithSession) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (!existingProfile) {
      return NextResponse.json(
        { error: "Account is missing a profile." },
        { status: 400 },
      );
    }
    let attached: { nextRole: string };
    try {
      attached = await attachInviteToExistingProfile(admin, {
        profile: existingProfile,
        inviteOrgId: invite.org_id,
        inviteRole: invite.role,
        phone: existingProfile.phone,
        jobTitle: invite.job_title ?? existingProfile.job_title,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Could not join." },
        { status: 500 },
      );
    }
    await ensureProfileShareSlug(admin, {
      id: user.id,
      full_name: existingProfile.full_name,
      share_slug: existingProfile.share_slug as string | null,
      role: attached.nextRole,
    });
    await markInviteUsed(admin, invite, {
      fullName: existingProfile.full_name,
      email: (existingProfile.email as string) ?? user.email ?? "",
      phone: existingProfile.phone,
      userId: user.id,
    });
    await notifyTeamJoined(admin, {
      orgId: invite.org_id,
      userId: user.id,
      fullName: existingProfile.full_name,
      role: invite.role,
      merged: true,
    });
    return NextResponse.json({ ok: true, userId: user.id, joinedWithSession: true });
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const phone = body.phone?.trim() || null;

  if (!fullName || !email) {
    return NextResponse.json(
      { error: "Token, name, and email are required." },
      { status: 400 },
    );
  }

  const existingProfile = await findExistingProfile(admin, email);
  const existingAuth = existingProfile
    ? { id: existingProfile.id as string }
    : await findAuthUserByEmail(admin, email);

  if (existingAuth) {
    const profileRow =
      existingProfile ??
      (
        await admin
          .from("profiles")
          .select("*")
          .eq("id", existingAuth.id)
          .maybeSingle()
      ).data;

    if (!profileRow) {
      return NextResponse.json(
        { error: "Account is missing a profile." },
        { status: 400 },
      );
    }

    const { data: membership } = await admin
      .from("org_memberships")
      .select("id")
      .eq("org_id", invite.org_id)
      .eq("profile_id", existingAuth.id)
      .maybeSingle();
    const alreadyOnOrg =
      Boolean(membership) || profileRow.org_id === invite.org_id;

    if (alreadyOnOrg) {
      try {
        await attachInviteToExistingProfile(admin, {
          profile: profileRow,
          inviteOrgId: invite.org_id,
          inviteRole: invite.role,
          phone: phone ?? profileRow.phone,
          jobTitle: invite.job_title ?? profileRow.job_title,
        });
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Could not join." },
          { status: 500 },
        );
      }
      await markInviteUsed(admin, invite, {
        fullName,
        email,
        phone,
        userId: existingAuth.id,
      });
      return NextResponse.json({
        ok: true,
        userId: existingAuth.id,
        email,
        alreadyMember: true,
      });
    }

    try {
      const merge = await startMergeRequest(admin, request, {
        invite,
        profileId: existingAuth.id,
        email,
        fullName,
        phone,
      });
      return NextResponse.json({
        ok: true,
        needsMergeConfirm: true,
        mergeEmailSent: merge.mergeEmailSent,
        mergeUrl: merge.mergeEmailSent ? undefined : merge.mergeUrl,
        orgName: merge.orgName,
        email,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Could not start merge." },
        { status: 500 },
      );
    }
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

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

  await markInviteUsed(admin, invite, { fullName, email, phone, userId });

  await notifyTeamJoined(admin, {
    orgId: invite.org_id,
    userId,
    fullName,
    role: invite.role,
    merged: false,
  });

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

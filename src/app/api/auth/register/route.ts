import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  companyTrialEndsAt,
  inviteTokenFromLink,
  slugifyName,
  uniqueShareSlug,
  type RegisterWorkspaceInput,
} from "@/lib/auth/helpers";
import { attachInviteToExistingProfile } from "@/lib/auth/attach-org";
import {
  isServicesRequest,
  safeConfirmNext,
  sendRegistrationConfirm,
} from "@/lib/auth/confirm-email";
import { ensureStaffContact } from "@/lib/contacts/ensure-staff-contact";
import { normalizeWorkTags } from "@/lib/talent";
import { storeAccountLogo } from "@/lib/auth/logo";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const rl = rateLimit(`register:${clientIp(request)}`, {
    limit: 8,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

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
  const onSiteStaff =
    body.position === "staff" ||
    body.track === "maintenance" ||
    role === "staff" ||
    role === "cleaner";
  const listOnServices = Boolean(body.listOnServices || body.service?.listNow);
  const payer = body.payer === "manager" ? "manager" : "owner";
  const marketplace = isServicesRequest(request);

  if (!body.termsAcceptedAt) {
    return NextResponse.json(
      { error: "Scroll to the end of the terms and privacy, then tick accept." },
      { status: 400 },
    );
  }
  if (!fullName || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Name, email, and a password (6+ chars) are required." },
      { status: 400 },
    );
  }
  if (kind !== "personal" && kind !== "company") {
    return NextResponse.json({ error: "Invalid organization kind." }, { status: 400 });
  }
  // Property app: on-site staff join a company with an invite link.
  // Services marketplace: maintenance accounts register on their own.
  if (kind === "company" && !orgName) {
    return NextResponse.json(
      { error: "Company name is required." },
      { status: 400 },
    );
  }
  if (kind === "personal" && role && role !== "owner" && !onSiteStaff) {
    return NextResponse.json(
      { error: "Personal workspaces always start as owner of your own list." },
      { status: 400 },
    );
  }
  if (kind === "company" && onSiteStaff) {
    return NextResponse.json(
      {
        error:
          "On-site staff join a company with an invite link, or register a personal workspace.",
      },
      { status: 400 },
    );
  }
  if (
    kind === "company" &&
    role != null &&
    role !== "owner" &&
    role !== "manager"
  ) {
    return NextResponse.json(
      {
        error:
          "Choose Owner (you pay) or Manager (invite the owner who pays). Other roles join with an invite link.",
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  let staffInvite: {
    id: string;
    org_id: string;
    role: string;
    job_title: string | null;
  } | null = null;
  if (onSiteStaff && !marketplace) {
    const token = inviteTokenFromLink(body.inviteToken ?? "");
    if (!token) {
      return NextResponse.json(
        { error: "A company invite link is required." },
        { status: 400 },
      );
    }
    const { data: invite } = await admin
      .from("invites")
      .select("id, org_id, role, job_title")
      .eq("token", token)
      .is("used_at", null)
      .maybeSingle();
    if (!invite || invite.role === "guest") {
      return NextResponse.json(
        { error: "That company invite link is invalid or already used." },
        { status: 400 },
      );
    }
    const { data: inviteOrg } = await admin
      .from("organizations")
      .select("kind")
      .eq("id", invite.org_id)
      .maybeSingle();
    if (inviteOrg?.kind !== "company") {
      return NextResponse.json(
        { error: "That invite is not for a company team." },
        { status: 400 },
      );
    }
    const { data: claimed, error: claimErr } = await admin
      .from("invites")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id)
      .is("used_at", null)
      .select("id");
    if (claimErr || !claimed?.length) {
      return NextResponse.json(
        { error: "That company invite link is invalid or already used." },
        { status: 400 },
      );
    }
    staffInvite = invite;
  }

  const releaseStaffInvite = async () => {
    if (!staffInvite) return;
    await admin
      .from("invites")
      .update({ used_at: null, used_by: null })
      .eq("id", staffInvite.id);
  };

  const invitedRole =
    staffInvite &&
    (staffInvite.role === "owner" ||
      staffInvite.role === "manager" ||
      staffInvite.role === "staff" ||
      staffInvite.role === "cleaner")
      ? staffInvite.role
      : null;
  const resolvedRole = invitedRole
    ? invitedRole
    : onSiteStaff
      ? role === "cleaner"
        ? ("cleaner" as const)
        : ("staff" as const)
      : kind === "company" && role === "manager"
        ? ("manager" as const)
        : ("owner" as const);
  const registrantPays =
    kind !== "company" ||
    (resolvedRole === "owner" && payer === "owner") ||
    (resolvedRole === "manager" && payer === "manager");

  const servicesReferral =
    (body.servicesIntent === "hire" || body.servicesIntent === "work") &&
    !body.inviteToken;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      full_name: fullName,
      terms_accepted_at: body.termsAcceptedAt,
      email_opt_in: Boolean(body.emailOptIn),
      list_on_services: listOnServices,
      referred_by: body.referredBy?.trim() || null,
      referral_source: servicesReferral ? "services" : "register",
    },
  });
  if (createErr || !created.user) {
    await releaseStaffInvite();
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
  const openTrial = isCompany && registrantPays;
  const orgRow: Record<string, unknown> = {
    name: workspaceName,
    kind,
    trial_ends_at: openTrial ? companyTrialEndsAt() : null,
    subscription_status: openTrial ? "trialing" : "none",
    billing_email: openTrial ? email : null,
  };
  const acquisition = body.acquisitionSource?.trim();
  if (acquisition) orgRow.acquisition_source = acquisition;

  let org: { id: string } | null = null;
  {
    const first = await admin
      .from("organizations")
      .insert(orgRow)
      .select("id")
      .single();
    if (
      first.error?.message?.includes("acquisition_source") &&
      orgRow.acquisition_source
    ) {
      delete orgRow.acquisition_source;
      const retry = await admin
        .from("organizations")
        .insert(orgRow)
        .select("id")
        .single();
      if (retry.error || !retry.data) {
        await releaseStaffInvite();
        await admin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: retry.error?.message ?? "Could not create organization." },
          { status: 500 },
        );
      }
      org = retry.data;
    } else if (first.error || !first.data) {
      await releaseStaffInvite();
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: first.error?.message ?? "Could not create organization." },
        { status: 500 },
      );
    } else {
      org = first.data;
    }
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

  const service = body.service;
  const profileRow: Record<string, unknown> = {
    id: userId,
    org_id: org.id,
    personal_org_id,
    role: resolvedRole,
    full_name: fullName,
    phone,
    email,
    job_title: staffInvite?.job_title?.trim()
      ? staffInvite.job_title.trim()
      : onSiteStaff
        ? resolvedRole === "cleaner"
          ? "On-site staff"
          : "Staff"
        : kind === "personal"
        ? "Personal"
        : resolvedRole === "manager"
          ? "Manager"
          : "Owner",
    share_slug,
  };
  if (typeof body.logo === "string" && body.logo.startsWith("data:image/")) {
    const logoUrl = await storeAccountLogo(admin, userId, body.logo);
    if (logoUrl) profileRow.logo_url = logoUrl;
  }
  if (body.servicesIntent === "hire" || body.servicesIntent === "work") {
    profileRow.services_intent = body.servicesIntent;
  } else if (onSiteStaff) {
    profileRow.services_intent = "work";
  }
  if (onSiteStaff || listOnServices) {
    profileRow.job_search_visible = false;
    profileRow.job_search_skills = service?.skills?.length
      ? service.skills
      : ["maintenance"];
    profileRow.job_search_tags = normalizeWorkTags(service?.tags);
    profileRow.job_search_bio = service?.bio?.trim() || null;
    profileRow.job_search_location = service?.location?.trim() || null;
    profileRow.job_search_country = service?.country?.trim() || null;
    profileRow.job_search_updated_at = new Date().toISOString();
  }

  let profileErr = (await admin.from("profiles").insert(profileRow)).error;
  if (profileErr && /logo_url/.test(profileErr.message)) {
    delete profileRow.logo_url;
    profileErr = (await admin.from("profiles").insert(profileRow)).error;
  }
  if (profileErr && /services_intent/.test(profileErr.message)) {
    delete profileRow.services_intent;
    profileErr = (await admin.from("profiles").insert(profileRow)).error;
  }
  if (profileErr && (onSiteStaff || listOnServices) && /job_search_/.test(profileErr.message)) {
    for (const key of Object.keys(profileRow)) {
      if (key.startsWith("job_search_")) delete profileRow[key];
    }
    profileErr = (await admin.from("profiles").insert(profileRow)).error;
  }

  if (profileErr) {
    await releaseStaffInvite();
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

  let joinedOrgId = org.id;
  if (staffInvite) {
    try {
      const attached = await attachInviteToExistingProfile(admin, {
        profile: {
          id: userId,
          org_id: org.id,
          personal_org_id,
          role: resolvedRole,
          full_name: fullName,
          phone,
          job_title: typeof profileRow.job_title === "string" ? profileRow.job_title : null,
        },
        inviteOrgId: staffInvite.org_id,
        inviteRole: staffInvite.role,
        phone,
        jobTitle: staffInvite.job_title,
      });
      joinedOrgId = attached.nextOrgId;
      await admin
        .from("invites")
        .update({
          full_name: fullName,
          email,
          phone,
          used_by: userId,
        })
        .eq("id", staffInvite.id);
      try {
        if (staffInvite.role !== "guest" && staffInvite.role !== "owner") {
          await ensureStaffContact(admin, {
            orgId: staffInvite.org_id,
            profile: {
              id: userId,
              full_name: fullName,
              phone,
              job_title: staffInvite.job_title,
              role: staffInvite.role,
            },
          });
        }
      } catch (e) {
        console.warn("ensureStaffContact failed", e);
      }
    } catch (e) {
      await releaseStaffInvite();
      await admin.from("profiles").delete().eq("id", userId);
      await admin.from("organizations").delete().eq("id", org.id);
      await admin.auth.admin.deleteUser(userId);
      const message = e instanceof Error ? e.message : "Could not join the company.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const nextPath = safeConfirmNext(
    marketplace ? (body.servicesIntent === "work" ? "/settings" : "/") : "/setup-passkey",
    marketplace,
  );
  const mail = await sendRegistrationConfirm(admin, request, {
    email,
    locale: body.locale,
    nextPath,
  });
  if (!mail.sent) {
    await releaseStaffInvite();
    await admin.from("org_memberships").delete().eq("profile_id", userId);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.from("organizations").delete().eq("id", org.id);
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Could not send the confirmation email. Try again in a moment." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, confirmEmail: true, orgId: joinedOrgId });
}

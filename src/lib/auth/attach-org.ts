import type { UserRole } from "@/lib/design-tokens";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AdminLike = {
  from: (table: string) => any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const ROLE_RANK: Record<string, number> = {
  owner: 50,
  manager: 40,
  staff: 30,
  cleaner: 30,
  guest: 10,
};

export function rankRole(role: string) {
  return ROLE_RANK[role] ?? 0;
}

/** Keep the stronger app role so a guest invite cannot demote an owner/manager. */
export function pickPrimaryRole(current: string, incoming: string) {
  return rankRole(current) >= rankRole(incoming) ? current : incoming;
}

export function roleInOrg(
  profile: { id: string; org_id: string; role: string },
  memberships: { profile_id: string; org_id: string; role: string }[],
  orgId: string,
): UserRole | null {
  const row = memberships.find(
    (m) => m.profile_id === profile.id && m.org_id === orgId,
  );
  if (row) return row.role as UserRole;
  if (profile.org_id === orgId) return profile.role as UserRole;
  return null;
}

type ProfileRow = {
  id: string;
  org_id: string;
  personal_org_id: string | null;
  role: string;
  full_name: string;
  phone: string | null;
  job_title: string | null;
  share_slug?: string | null;
};

export async function ensureOrgMembership(
  admin: AdminLike,
  input: { orgId: string; profileId: string; role: string },
) {
  const { data } = await admin
    .from("org_memberships")
    .select("id, role")
    .eq("org_id", input.orgId)
    .eq("profile_id", input.profileId)
    .maybeSingle();

  if (!data) {
    const { error } = await admin.from("org_memberships").insert({
      org_id: input.orgId,
      profile_id: input.profileId,
      role: input.role,
    });
    if (error) throw new Error(error.message);
    return;
  }

  if (rankRole(input.role) > rankRole(String(data.role))) {
    const { error } = await admin
      .from("org_memberships")
      .update({ role: input.role })
      .eq("id", String(data.id));
    if (error) throw new Error(error.message);
  }
}

/**
 * Link an existing profile to another company without wiping the first one.
 * One login, one profile, a membership row per company.
 */
export async function attachInviteToExistingProfile(
  admin: AdminLike,
  input: {
    profile: ProfileRow;
    inviteOrgId: string;
    inviteRole: string;
    phone?: string | null;
    jobTitle?: string | null;
  },
) {
  const profile = input.profile;
  const { data: currentOrg } = await admin
    .from("organizations")
    .select("id, kind")
    .eq("id", profile.org_id)
    .maybeSingle();

  if (
    currentOrg?.kind === "company" &&
    profile.org_id !== input.inviteOrgId
  ) {
    await ensureOrgMembership(admin, {
      orgId: profile.org_id,
      profileId: profile.id,
      role: profile.role,
    });
  }

  await ensureOrgMembership(admin, {
    orgId: input.inviteOrgId,
    profileId: profile.id,
    role: input.inviteRole,
  });

  let personalOrgId = profile.personal_org_id;
  if (!personalOrgId) {
    if (currentOrg?.kind === "personal") {
      personalOrgId = profile.org_id;
    } else {
      const { data: personalOrg, error: pErr } = await admin
        .from("organizations")
        .insert({
          name: `${String(profile.full_name).split(" ")[0] || "My"}'s personal ops`,
          kind: "personal",
          subscription_status: "none",
        })
        .select("id")
        .single();
      if (pErr || !personalOrg?.id) {
        throw new Error(pErr?.message ?? "Could not create personal org.");
      }
      personalOrgId = String(personalOrg.id);
    }
  }

  const nextRole = pickPrimaryRole(profile.role, input.inviteRole);
  let nextOrgId = profile.org_id;
  const upgradingFromGuest =
    profile.role === "guest" && input.inviteRole !== "guest";
  if (upgradingFromGuest || currentOrg?.kind === "personal") {
    nextOrgId = input.inviteOrgId;
  }

  const { error } = await admin
    .from("profiles")
    .update({
      org_id: nextOrgId,
      role: nextRole,
      personal_org_id: personalOrgId,
      job_title: input.jobTitle ?? profile.job_title,
      phone: input.phone ?? profile.phone,
    })
    .eq("id", profile.id);
  if (error) throw new Error(error.message);

  return { nextRole, nextOrgId, personalOrgId };
}

import type { SupabaseClient } from "@supabase/supabase-js";

export const REFERRAL_GOAL = 5;
export const REFERRAL_BONUS_MS = 365 * 24 * 60 * 60 * 1000;

export type ReferralProgress = {
  count: number;
  goal: number;
  claimed: boolean;
  bonusEndsAt: string | null;
};

export async function resolveReferrerId(
  admin: SupabaseClient,
  code: string | null | undefined,
): Promise<string | null> {
  const trimmed = code?.trim();
  if (!trimmed) return null;

  const { data: bySlug } = await admin
    .from("profiles")
    .select("id")
    .eq("share_slug", trimmed)
    .maybeSingle();
  if (bySlug?.id) return bySlug.id;

  if (trimmed.length >= 8) {
    const { data: rows } = await admin
      .from("profiles")
      .select("id")
      .ilike("id", `${trimmed}%`)
      .limit(2);
    if (rows?.length === 1) return rows[0]!.id;
  }
  return null;
}

async function referrerCompanyOrgId(
  admin: SupabaseClient,
  referrerId: string,
): Promise<{ orgId: string; claimed: boolean } | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select("org_id, role")
    .eq("id", referrerId)
    .maybeSingle();
  if (!profile) return null;

  const { data: activeOrg } = await admin
    .from("organizations")
    .select("id, kind, referral_year_claimed")
    .eq("id", profile.org_id)
    .maybeSingle();
  if (activeOrg?.kind === "company" && profile.role === "owner") {
    return { orgId: activeOrg.id, claimed: activeOrg.referral_year_claimed };
  }

  const { data: memberships } = await admin
    .from("org_memberships")
    .select("org_id")
    .eq("profile_id", referrerId)
    .eq("role", "owner");

  for (const row of memberships ?? []) {
    const { data: org } = await admin
      .from("organizations")
      .select("id, kind, referral_year_claimed")
      .eq("id", row.org_id)
      .maybeSingle();
    if (org?.kind === "company") {
      return { orgId: org.id, claimed: org.referral_year_claimed };
    }
  }
  return null;
}

async function maybeGrantReferralYear(
  admin: SupabaseClient,
  referrerId: string,
) {
  const { count } = await admin
    .from("referral_credits")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", referrerId);
  if ((count ?? 0) < REFERRAL_GOAL) return;

  const target = await referrerCompanyOrgId(admin, referrerId);
  if (!target || target.claimed) return;

  const bonusEnds = new Date(Date.now() + REFERRAL_BONUS_MS).toISOString();
  await admin
    .from("organizations")
    .update({
      referral_bonus_ends_at: bonusEnds,
      referral_year_claimed: true,
      subscription_status: "active",
    })
    .eq("id", target.orgId);
}

export async function creditReferral(
  admin: SupabaseClient,
  input: {
    referrerCode?: string | null;
    referredProfileId: string;
    source: "register" | "invite";
    fallbackReferrerId?: string | null;
  },
) {
  const referrerId =
    (await resolveReferrerId(admin, input.referrerCode)) ??
    input.fallbackReferrerId ??
    null;
  if (!referrerId || referrerId === input.referredProfileId) return;

  const { error } = await admin.from("referral_credits").insert({
    referrer_id: referrerId,
    referred_id: input.referredProfileId,
    source: input.source,
  });
  if (error?.code === "23505") return;
  if (error) throw error;

  await maybeGrantReferralYear(admin, referrerId);
}

export async function getReferralProgress(
  admin: SupabaseClient,
  profileId: string,
): Promise<ReferralProgress> {
  const { count } = await admin
    .from("referral_credits")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", profileId);

  const target = await referrerCompanyOrgId(admin, profileId);
  let bonusEndsAt: string | null = null;
  if (target) {
    const { data: org } = await admin
      .from("organizations")
      .select("referral_bonus_ends_at, referral_year_claimed")
      .eq("id", target.orgId)
      .maybeSingle();
    bonusEndsAt = org?.referral_bonus_ends_at ?? null;
    return {
      count: count ?? 0,
      goal: REFERRAL_GOAL,
      claimed: org?.referral_year_claimed ?? false,
      bonusEndsAt,
    };
  }

  return {
    count: count ?? 0,
    goal: REFERRAL_GOAL,
    claimed: false,
    bonusEndsAt: null,
  };
}

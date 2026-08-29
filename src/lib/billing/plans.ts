import type { OrgKind, UserRole } from "@/lib/design-tokens";
import {
  isCompanyEntitled,
  trialDaysRemaining,
} from "@/lib/billing/entitlement";
import type { Organization } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";

/** Purchasable / display tiers. Manager reporting is included with Full, not a separate tier. */
export type PlanTier = "free" | "full" | "trial" | "expired";

export function resolvePlanTier(input: {
  role: UserRole;
  orgKind: OrgKind | null | undefined;
  organization: Organization | null | undefined;
}): {
  tier: PlanTier;
  labelKey: MessageKey;
  noteKey: MessageKey;
} {
  const { role, orgKind, organization } = input;

  if (orgKind !== "company") {
    return {
      tier: "free",
      labelKey: "plan.free",
      noteKey: "plan.note.personal",
    };
  }

  const entitled = isCompanyEntitled(organization ?? null);
  const days = trialDaysRemaining(organization?.trial_ends_at);
  const onTrial =
    entitled &&
    (organization?.subscription_status === "trialing" ||
      (days != null && days > 0 && organization?.subscription_status !== "active"));

  if (role === "owner") {
    if (!entitled) {
      return {
        tier: "expired",
        labelKey: "plan.expired",
        noteKey: "plan.note.ownerExpired",
      };
    }
    if (onTrial) {
      return {
        tier: "trial",
        labelKey: "plan.trial",
        noteKey: "plan.note.ownerTrial",
      };
    }
    return {
      tier: "full",
      labelKey: "plan.full",
      noteKey: "plan.note.ownerFull",
    };
  }

  if (role === "manager") {
    if (!entitled) {
      return {
        tier: "free",
        labelKey: "plan.free",
        noteKey: "plan.note.managerLimited",
      };
    }
    if (onTrial) {
      return {
        tier: "trial",
        labelKey: "plan.trial",
        noteKey: "plan.note.managerIncluded",
      };
    }
    return {
      tier: "full",
      labelKey: "plan.full",
      noteKey: "plan.note.managerIncluded",
    };
  }

  return {
    tier: "free",
    labelKey: "plan.free",
    noteKey: "plan.note.staff",
  };
}

export const REFERRAL_STORAGE_KEY = "pulseflow_referral_code";
export const REFERRAL_QUERY_PARAM = "from";

/** Read referrer code from URL (?from= preferred, ?ref= legacy). */
export function readReferralParam(
  searchParams: URLSearchParams | null | undefined,
): string | null {
  if (!searchParams) return null;
  const from = searchParams.get(REFERRAL_QUERY_PARAM)?.trim();
  if (from) return from;
  return searchParams.get("ref")?.trim() || null;
}

/** Generic app invite - recipient picks personal or company on /register. */
export function referralRegisterUrl(origin: string, refCode: string) {
  const url = new URL(`${origin}/register`);
  url.searchParams.set(REFERRAL_QUERY_PARAM, refCode);
  return url.toString();
}

/** Teammate join links also carry the inviter's referral code toward the year unlock. */
export function referralJoinUrl(
  origin: string,
  inviteToken: string,
  refCode: string,
) {
  const url = new URL(`${origin}/join/${inviteToken}`);
  url.searchParams.set(REFERRAL_QUERY_PARAM, refCode);
  return url.toString();
}

export function rememberReferralCode(refCode: string | null | undefined) {
  if (typeof window === "undefined") return;
  const trimmed = refCode?.trim();
  if (!trimmed) return;
  window.localStorage.setItem(REFERRAL_STORAGE_KEY, trimmed);
}

/** Parse a pasted invite URL or raw token for /join/[token]. */
export function extractInviteToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/join/")) {
    try {
      const url = trimmed.startsWith("http")
        ? new URL(trimmed)
        : new URL(trimmed, "https://app.pulseflow.site");
      const match = url.pathname.match(/\/join\/([^/?#]+)/);
      if (match?.[1]) return decodeURIComponent(match[1]);
    } catch {
      const match = trimmed.match(/\/join\/([^/?#\s]+)/);
      if (match?.[1]) return decodeURIComponent(match[1]);
    }
  }
  if (/^[a-zA-Z0-9_-]{16,}$/.test(trimmed)) return trimmed;
  return null;
}

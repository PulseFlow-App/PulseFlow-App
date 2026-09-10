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

  if (role === "guest") {
    return {
      tier: "free",
      labelKey: "plan.guest",
      noteKey: "plan.note.guest",
    };
  }

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
/** Channel mark: telegram_phuket, facebook_phangan, founder, site_demo, … */
export const SOURCE_QUERY_PARAM = "src";
export const ATTRIBUTION_STORAGE_KEY = "pulseflow_attribution";

export type LinkAttribution = {
  src?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

/** Read referrer code from URL (?from= preferred, ?ref= legacy). */
export function readReferralParam(
  searchParams: URLSearchParams | null | undefined,
): string | null {
  if (!searchParams) return null;
  const from = searchParams.get(REFERRAL_QUERY_PARAM)?.trim();
  if (from) return from;
  return searchParams.get("ref")?.trim() || null;
}

export function readAttribution(
  searchParams: URLSearchParams | null | undefined,
): LinkAttribution {
  if (!searchParams) return {};
  const pick = (k: string) => searchParams.get(k)?.trim() || null;
  return {
    src: pick(SOURCE_QUERY_PARAM),
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
  };
}

export function rememberAttribution(attr: LinkAttribution | null | undefined) {
  if (typeof window === "undefined" || !attr) return;
  const cleaned: LinkAttribution = {};
  for (const key of ["src", "utm_source", "utm_medium", "utm_campaign"] as const) {
    const v = attr[key]?.trim();
    if (v) cleaned[key] = v;
  }
  if (!Object.keys(cleaned).length) return;
  try {
    const prev = readStoredAttribution() ?? {};
    localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ ...prev, ...cleaned }),
    );
  } catch {
    /* ignore */
  }
}

export function readStoredAttribution(): LinkAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LinkAttribution;
  } catch {
    return null;
  }
}

function applyAttribution(
  url: URL,
  attribution?: LinkAttribution | null,
  defaults?: LinkAttribution,
) {
  const merged: LinkAttribution = { ...defaults, ...attribution };
  if (merged.src) url.searchParams.set(SOURCE_QUERY_PARAM, merged.src);
  if (merged.utm_source) url.searchParams.set("utm_source", merged.utm_source);
  if (merged.utm_medium) url.searchParams.set("utm_medium", merged.utm_medium);
  if (merged.utm_campaign) {
    url.searchParams.set("utm_campaign", merged.utm_campaign);
  }
}

/** Generic app invite - recipient picks personal or company on /register. */
export function referralRegisterUrl(
  origin: string,
  refCode: string,
  attribution?: LinkAttribution | null,
) {
  const url = new URL(`${origin}/register`);
  url.searchParams.set(REFERRAL_QUERY_PARAM, refCode);
  applyAttribution(url, attribution, {
    utm_source: "referral",
    utm_medium: "link",
    utm_campaign: "invite_anyone",
  });
  return url.toString();
}

/** Teammate join links also carry the inviter's referral code toward the year unlock. */
export function referralJoinUrl(
  origin: string,
  inviteToken: string,
  refCode: string,
  attribution?: LinkAttribution | null,
) {
  const url = new URL(`${origin}/join/${inviteToken}`);
  url.searchParams.set(REFERRAL_QUERY_PARAM, refCode);
  applyAttribution(url, attribution, {
    utm_source: "invite",
    utm_medium: "link",
    utm_campaign: "team_join",
  });
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

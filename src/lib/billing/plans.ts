import type { OrgKind, UserRole } from "@/lib/design-tokens";
import {
  isCompanyEntitled,
  trialDaysRemaining,
} from "@/lib/billing/entitlement";
import type { Organization } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";

export type PlanTier = "free" | "basic" | "full" | "trial" | "expired";

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
    // While company Full/trial is active, managers receive Basic reporting seats.
    return {
      tier: "basic",
      labelKey: "plan.basic",
      noteKey: "plan.note.managerBasic",
    };
  }

  return {
    tier: "free",
    labelKey: "plan.free",
    noteKey: "plan.note.staff",
  };
}

export const REFERRAL_STORAGE_KEY = "pulseflow_referral_code";

export function referralRegisterUrl(origin: string, refCode: string) {
  return `${origin}/register?ref=${encodeURIComponent(refCode)}`;
}

/** Teammate join links also carry the inviter's referral code toward the year unlock. */
export function referralJoinUrl(
  origin: string,
  inviteToken: string,
  refCode: string,
) {
  const url = new URL(`${origin}/join/${inviteToken}`);
  url.searchParams.set("ref", refCode);
  return url.toString();
}

export function rememberReferralCode(refCode: string | null | undefined) {
  if (typeof window === "undefined") return;
  const trimmed = refCode?.trim();
  if (!trimmed) return;
  window.localStorage.setItem(REFERRAL_STORAGE_KEY, trimmed);
}

import type { Organization } from "@/lib/types";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export type OrgBilling = Pick<
  Organization,
  | "id"
  | "kind"
  | "trial_ends_at"
  | "subscription_status"
  | "stripe_customer_id"
  | "stripe_subscription_id"
  | "billing_email"
>;

/** Personal orgs are always entitled. Company needs trial or paid status. */
export function isCompanyEntitled(
  org: Pick<
    Organization,
    "kind" | "trial_ends_at" | "subscription_status"
  > | null,
  now = new Date(),
): boolean {
  if (!org) return false;
  if (org.kind === "personal") return true;
  if (
    org.subscription_status === "trialing" ||
    org.subscription_status === "active"
  ) {
    return true;
  }
  if (org.trial_ends_at && new Date(org.trial_ends_at) > now) {
    return true;
  }
  return false;
}

export function trialDaysRemaining(
  trialEndsAt: string | null | undefined,
  now = new Date(),
): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export const ENTITLEMENT_BLOCKED_MESSAGE =
  "Your company trial has ended. The owner must subscribe to keep creating invites, villas, and service orders.";

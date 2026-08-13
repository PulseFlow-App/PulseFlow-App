import { createAdminClient } from "@/lib/supabase/admin";
import {
  ENTITLEMENT_BLOCKED_MESSAGE,
  isCompanyEntitled,
} from "@/lib/billing/entitlement";

export async function assertCompanyEntitled(orgId: string) {
  const admin = createAdminClient();
  const { data: org, error } = await admin
    .from("organizations")
    .select(
      "id, kind, trial_ends_at, subscription_status, stripe_customer_id, stripe_subscription_id, billing_email, name, created_at",
    )
    .eq("id", orgId)
    .single();

  if (error || !org) {
    throw new Error("Organization not found.");
  }
  if (!isCompanyEntitled(org)) {
    throw new Error(ENTITLEMENT_BLOCKED_MESSAGE);
  }
  return org;
}

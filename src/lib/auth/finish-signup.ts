import type { SupabaseClient } from "@supabase/supabase-js";
import { creditReferral } from "@/lib/billing/referrals";

/** After the person opens the email link: publish a listing they asked for, and count a referral once. */
export async function finishConfirmedSignup(admin: SupabaseClient, user: {
  id: string;
  user_metadata?: Record<string, unknown> | null;
}) {
  const meta = user.user_metadata ?? {};
  if (meta.list_on_services === true) {
    await admin.from("profiles").update({ job_search_visible: true }).eq("id", user.id);
  }
  const referredBy = typeof meta.referred_by === "string" ? meta.referred_by : null;
  const source = meta.referral_source === "services" ? "services" : "register";
  if (!referredBy) return;
  try {
    await creditReferral(admin, {
      referrerCode: referredBy,
      referredProfileId: user.id,
      source,
    });
  } catch (e) {
    console.warn("referral credit failed", e);
  }
}

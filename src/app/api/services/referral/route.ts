import { NextResponse } from "next/server";
import { SERVICES_REFERRAL_GOAL } from "@/lib/billing/referrals";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({
      code: "",
      count: 0,
      goal: SERVICES_REFERRAL_GOAL,
      discount: false,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("share_slug, services_referral_discount")
    .eq("id", user.id)
    .maybeSingle();

  const { count } = await admin
    .from("referral_credits")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .eq("source", "services");

  return NextResponse.json({
    code: profile?.share_slug ?? "",
    count: count ?? 0,
    goal: SERVICES_REFERRAL_GOAL,
    discount: Boolean(profile?.services_referral_discount),
  });
}

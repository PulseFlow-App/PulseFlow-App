import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReferralProgress, REFERRAL_GOAL } from "@/lib/billing/referrals";
import { isDemoMode } from "@/lib/env";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      count: 2,
      goal: REFERRAL_GOAL,
      claimed: false,
      bonusEndsAt: null,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const progress = await getReferralProgress(admin, user.id);
  return NextResponse.json(progress);
}

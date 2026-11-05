import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { creditReferral } from "@/lib/billing/referrals";
import { isMarketplaceHost } from "@/lib/pros/paths";
import { safeConfirmNext } from "@/lib/auth/confirm-email";

const OTP_TYPES = new Set(["signup", "invite", "magiclink", "email"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const marketplace = isMarketplaceHost(host);
  const nextPath = safeConfirmNext(url.searchParams.get("next"), marketplace);
  const fail = new URL(marketplace ? "/start" : "/login", url.origin);
  fail.searchParams.set("error", "confirm");

  const tokenHash = url.searchParams.get("token_hash") ?? "";
  const type = url.searchParams.get("type") ?? "";
  if (!tokenHash || !OTP_TYPES.has(type)) {
    return NextResponse.redirect(fail);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "magiclink",
  });
  if (error) return NextResponse.redirect(fail);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    const meta = user.user_metadata ?? {};
    if (meta.list_on_services === true) {
      await admin.from("profiles").update({ job_search_visible: true }).eq("id", user.id);
    }
    const referredBy = typeof meta.referred_by === "string" ? meta.referred_by : null;
    const source = meta.referral_source === "services" ? "services" : "register";
    if (referredBy) {
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
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}

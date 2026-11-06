import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { finishConfirmedSignup } from "@/lib/auth/finish-signup";
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
    await finishConfirmedSignup(createAdminClient(), user);
  }

  const dest = new URL(nextPath, url.origin);
  dest.searchParams.set("openApp", "1");
  return NextResponse.redirect(dest);
}

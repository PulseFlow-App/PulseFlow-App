import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { finishConfirmedSignup } from "@/lib/auth/finish-signup";

/** Called after the email link signs the person in from the browser. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) {
    return NextResponse.json({ error: "Email is not confirmed yet." }, { status: 401 });
  }
  await finishConfirmedSignup(createAdminClient(), user);
  return NextResponse.json({ ok: true });
}

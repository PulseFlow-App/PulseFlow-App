import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";

export const runtime = "nodejs";

/** Permanently delete the signed-in user's auth account (cascades profile). */
export async function POST(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json(
      { error: "Demo accounts cannot be deleted. Sign out of demo instead." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Could not delete account." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

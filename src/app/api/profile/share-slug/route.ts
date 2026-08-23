import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfileShareSlug } from "@/lib/auth/share-slug";
import { isDemoMode } from "@/lib/env";

export async function POST() {
  if (isDemoMode()) {
    return NextResponse.json({ share_slug: "demo-member" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, share_slug, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: profileError?.message ?? "Profile not found." },
      { status: 400 },
    );
  }

  if (profile.role === "owner") {
    return NextResponse.json({ share_slug: null });
  }

  try {
    const share_slug = await ensureProfileShareSlug(admin, profile);
    return NextResponse.json({ share_slug });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not create share link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

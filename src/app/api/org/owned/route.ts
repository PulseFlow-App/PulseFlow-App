import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

/** Companies the signed-in user owns (for handoff attach). */
export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ companies: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from("org_memberships")
    .select("org_id, role")
    .eq("profile_id", user.id)
    .eq("role", "owner");

  const { data: profile } = await admin
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const ids = new Set<string>();
  for (const m of memberships ?? []) ids.add(String(m.org_id));
  if (profile?.role === "owner" && profile.org_id) ids.add(String(profile.org_id));

  if (!ids.size) {
    return NextResponse.json({ companies: [] });
  }

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, kind")
    .in("id", [...ids])
    .eq("kind", "company")
    .order("name");

  return NextResponse.json({
    companies: (orgs ?? []).map((o) => ({
      id: o.id,
      name: o.name,
    })),
  });
}

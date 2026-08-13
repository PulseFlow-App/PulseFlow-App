import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/env";

/** Ensure the signed-in user has a personal org for side villas. */
export async function POST() {
  if (isDemoMode()) {
    return NextResponse.json({ error: "Demo mode" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.personal_org_id) {
    return NextResponse.json({ personalOrgId: profile.personal_org_id });
  }

  const { data: org, error } = await admin
    .from("organizations")
    .insert({
      name: `${String(profile.full_name).split(" ")[0]}'s personal ops`,
      kind: "personal",
      subscription_status: "none",
    })
    .select("id")
    .single();

  if (error || !org) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create personal org" },
      { status: 500 },
    );
  }

  await admin
    .from("profiles")
    .update({ personal_org_id: org.id })
    .eq("id", user.id);

  return NextResponse.json({ personalOrgId: org.id });
}

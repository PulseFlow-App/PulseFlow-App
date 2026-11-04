import { NextResponse } from "next/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Marketplace requests this person was asked to do, after the accounts are merged. */
export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ gigs: [] });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_link")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.account_link !== "merged") return NextResponse.json({ gigs: [] });

  const { data } = await admin
    .from("service_requests")
    .select("id, title, description, when_label, created_at, reply_message")
    .eq("target_profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    gigs: (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      when: row.when_label,
      replied: Boolean(row.reply_message),
    })),
  });
}

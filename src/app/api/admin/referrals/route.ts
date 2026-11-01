import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";

function adminIds() {
  return (process.env.PROS_ADMIN_IDS ?? process.env.NEXT_PUBLIC_PROS_ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Live referral ledger. Demo signups stay on this device and are read by the panel directly. */
export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ rows: [], demo: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !adminIds().includes(user.id)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("referral_credits")
    .select("id, referrer_id, referred_id, source, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = [
    ...new Set((data ?? []).flatMap((row) => [row.referrer_id, row.referred_id])),
  ];
  const { data: profiles } = ids.length
    ? await admin
        .from("profiles")
        .select("id, full_name, email, share_slug, role")
        .in("id", ids)
    : { data: [] as { id: string; full_name: string; email: string | null; share_slug: string | null; role: string }[] };
  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return NextResponse.json({
    rows: (data ?? []).map((row) => ({
      id: row.id,
      at: row.created_at,
      source: row.source,
      referrer: byId.get(row.referrer_id)?.full_name ?? "Unknown",
      referrerEmail: byId.get(row.referrer_id)?.email ?? null,
      referrerCode: byId.get(row.referrer_id)?.share_slug ?? null,
      referred: byId.get(row.referred_id)?.full_name ?? "Unknown",
      referredEmail: byId.get(row.referred_id)?.email ?? null,
      referredRole: byId.get(row.referred_id)?.role ?? null,
    })),
  });
}

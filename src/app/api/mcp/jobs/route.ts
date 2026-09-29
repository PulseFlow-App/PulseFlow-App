import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";

export const runtime = "nodejs";

/** List service orders (jobs) in the token's org. */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "jobs:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? "40") || 40),
  );

  const admin = createAdminClient();
  let q = admin
    .from("service_orders")
    .select(
      "id, service_type, status, scheduled_date, time_start, time_end, location_label, staff_profile_id, ordered_by, created_at, details",
    )
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (
    status &&
    ["pending_ack", "agreed", "done", "cancelled"].includes(status)
  ) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data ?? [] });
}

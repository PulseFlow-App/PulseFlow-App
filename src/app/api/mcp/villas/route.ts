import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";

export const runtime = "nodejs";

/** List villas in the token's org. */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "villas:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? "50") || 50),
  );
  const status = url.searchParams.get("status");

  const admin = createAdminClient();
  let q = admin
    .from("villas")
    .select(
      "id, name, status, cleaning_status, check_in, check_out, area, property_type, updated_at",
    )
    .eq("org_id", auth.orgId)
    .order("name")
    .limit(limit);

  if (
    status &&
    ["available", "occupied", "turnover", "maintenance"].includes(status)
  ) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ villas: data ?? [] });
}

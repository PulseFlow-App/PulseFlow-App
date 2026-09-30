import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";

export const runtime = "nodejs";

/** List non-guest teammates in the token's org (for assignees). */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "team:read");
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, role, email")
    .eq("org_id", auth.orgId)
    .neq("role", "guest")
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    team: (data ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      email: p.email || null,
    })),
  });
}

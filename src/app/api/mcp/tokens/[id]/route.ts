import { NextResponse } from "next/server";
import { requireMcpTokenManager } from "@/lib/mcp/auth";

export const runtime = "nodejs";

/** Revoke (soft-delete) one of your MCP tokens. */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMcpTokenManager();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("profile_id", auth.profile.id)
    .eq("org_id", auth.profile.org_id)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Token not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

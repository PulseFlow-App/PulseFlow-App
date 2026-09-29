import { NextResponse } from "next/server";
import { z } from "zod";
import {
  DEFAULT_MCP_SCOPES,
  isMcpScope,
  mintMcpTokenPlaintext,
  requireMcpTokenManager,
} from "@/lib/mcp/auth";

export const runtime = "nodejs";

const createSchema = z.object({
  label: z.string().trim().min(1).max(60).optional(),
  scopes: z.array(z.string()).max(12).optional(),
});

/** List active MCP tokens for the signed-in owner/manager. */
export async function GET() {
  const auth = await requireMcpTokenManager();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("mcp_tokens")
    .select("id, label, token_prefix, scopes, created_at, last_used_at, revoked_at")
    .eq("profile_id", auth.profile.id)
    .eq("org_id", auth.profile.org_id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tokens: data ?? [] });
}

/** Create a token — plaintext returned once. */
export async function POST(request: Request) {
  const auth = await requireMcpTokenManager();
  if ("error" in auth) return auth.error;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const scopes = body.scopes?.length
    ? [...new Set(body.scopes.filter(isMcpScope))]
    : [...DEFAULT_MCP_SCOPES];
  if (!scopes.length) {
    return NextResponse.json({ error: "No valid scopes." }, { status: 400 });
  }

  const minted = mintMcpTokenPlaintext();
      const label = body.label?.trim() || "My agent";

  const { data, error } = await auth.supabase
    .from("mcp_tokens")
    .insert({
      profile_id: auth.profile.id,
      org_id: auth.profile.org_id,
      label,
      token_prefix: minted.prefix,
      token_hash: minted.hash,
      scopes,
    })
    .select("id, label, token_prefix, scopes, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create token." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    token: minted.token,
    record: data,
    hint: "Copy this token now. It will not be shown again.",
  });
}

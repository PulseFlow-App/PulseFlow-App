import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import type { UserRole } from "@/lib/design-tokens";
import {
  canManageMcpTokens,
  DEFAULT_MCP_SCOPES,
  isMcpScope,
  normalizeMcpScopes,
  type McpScope,
} from "@/lib/mcp/scopes";

export {
  canManageMcpTokens,
  DEFAULT_MCP_SCOPES,
  isMcpScope,
  MCP_SCOPES,
  normalizeMcpScopes,
  type McpScope,
} from "@/lib/mcp/scopes";

const TOKEN_PREFIX = "pfmcp_";

export function hashMcpToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function mintMcpTokenPlaintext() {
  const secret = randomBytes(32).toString("base64url");
  const token = `${TOKEN_PREFIX}${secret}`;
  return {
    token,
    prefix: token.slice(0, 12),
    hash: hashMcpToken(token),
  };
}

export type McpAuthContext = {
  tokenId: string;
  profileId: string;
  orgId: string;
  role: UserRole;
  scopes: McpScope[];
  fullName: string;
};

function bearerFromRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

/** Resolve MCP bearer token → profile/org scoped context. */
export async function requireMcpAuth(
  request: Request,
  needed: McpScope | McpScope[],
): Promise<McpAuthContext | NextResponse> {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json(
      { error: "MCP is not available in demo mode." },
      { status: 403 },
    );
  }

  const token = bearerFromRequest(request);
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const neededList = Array.isArray(needed) ? needed : [needed];
  const admin = createAdminClient();
  const hash = hashMcpToken(token);

  const { data: row, error } = await admin
    .from("mcp_tokens")
    .select("id, profile_id, org_id, scopes, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();

  if (error || !row || row.revoked_at) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scopes = normalizeMcpScopes(row.scopes);
  if (!neededList.every((s) => scopes.includes(s))) {
    return NextResponse.json(
      { error: "Token missing required scope.", needed: neededList },
      { status: 403 },
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role, org_id")
    .eq("id", row.profile_id)
    .maybeSingle();

  if (!profile || profile.org_id !== row.org_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageMcpTokens(profile.role as UserRole)) {
    return NextResponse.json(
      { error: "Only owners and managers can use MCP tokens." },
      { status: 403 },
    );
  }

  void admin
    .from("mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id);

  return {
    tokenId: row.id as string,
    profileId: profile.id as string,
    orgId: row.org_id as string,
    role: profile.role as UserRole,
    scopes,
    fullName: (profile.full_name as string) || "User",
  };
}

/** Session auth for minting / listing / revoking tokens in Settings. */
export async function requireMcpTokenManager() {
  if (isDemoMode()) {
    return {
      error: NextResponse.json(
        { error: "Demo mode cannot mint MCP tokens." },
        { status: 403 },
      ),
    } as const;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, org_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      error: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    } as const;
  }

  if (!canManageMcpTokens(profile.role as UserRole)) {
    return {
      error: NextResponse.json(
        { error: "Only owners and managers can manage MCP tokens." },
        { status: 403 },
      ),
    } as const;
  }

  return { supabase, profile } as const;
}

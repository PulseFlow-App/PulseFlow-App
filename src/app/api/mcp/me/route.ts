import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/mcp/auth";

export const runtime = "nodejs";

/** Who the token acts as (org-scoped). */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "me:read");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    profile_id: auth.profileId,
    org_id: auth.orgId,
    full_name: auth.fullName,
    role: auth.role,
    scopes: auth.scopes,
  });
}

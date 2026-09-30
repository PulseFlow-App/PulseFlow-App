import type { UserRole } from "@/lib/design-tokens";

export const MCP_SCOPES = [
  "me:read",
  "tasks:read",
  "tasks:write",
  "jobs:read",
  "jobs:write",
  "villas:read",
  "team:read",
  "bills:read",
] as const;

export type McpScope = (typeof MCP_SCOPES)[number];

export const DEFAULT_MCP_SCOPES: McpScope[] = [...MCP_SCOPES];

export function isMcpScope(value: string): value is McpScope {
  return (MCP_SCOPES as readonly string[]).includes(value);
}

export function normalizeMcpScopes(raw: unknown): McpScope[] {
  if (!Array.isArray(raw)) return [...DEFAULT_MCP_SCOPES];
  const out = raw.filter(
    (s): s is McpScope => typeof s === "string" && isMcpScope(s),
  );
  if (!out.length) return [...DEFAULT_MCP_SCOPES];
  // Tokens minted with the original default set unlock new default scopes too.
  const legacyDefault = [
    "me:read",
    "tasks:read",
    "tasks:write",
    "jobs:read",
  ] as const;
  if (legacyDefault.every((s) => out.includes(s))) {
    return [...DEFAULT_MCP_SCOPES];
  }
  return [...new Set(out)];
}

export function canManageMcpTokens(role: UserRole) {
  return role === "owner" || role === "manager";
}

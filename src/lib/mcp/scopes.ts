import type { UserRole } from "@/lib/design-tokens";

export const MCP_SCOPES = [
  "me:read",
  "tasks:read",
  "tasks:write",
  "jobs:read",
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
  return out.length ? [...new Set(out)] : [...DEFAULT_MCP_SCOPES];
}

export function canManageMcpTokens(role: UserRole) {
  return role === "owner" || role === "manager";
}

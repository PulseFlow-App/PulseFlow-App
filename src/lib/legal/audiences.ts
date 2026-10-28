import type { UserRole } from "@/lib/design-tokens";

export const LEGAL_AUDIENCES = [
  "all",
  "guest",
  "owner",
  "staff",
  "agent",
] as const;

export type LegalAudience = (typeof LEGAL_AUDIENCES)[number];

export function parseLegalAudience(
  value: string | null | undefined,
): LegalAudience {
  // Legacy ?for=employee / cleaner → staff (cleaning is not a separate product role).
  if (value === "employee" || value === "cleaner") return "staff";
  if (value && (LEGAL_AUDIENCES as readonly string[]).includes(value)) {
    return value as LegalAudience;
  }
  return "all";
}

export function legalAudienceFromRole(role: UserRole): LegalAudience {
  if (role === "guest") return "guest";
  if (role === "owner" || role === "manager") return "owner";
  if (role === "cleaner" || role === "staff") return "staff";
  return "all";
}

export function legalAudienceLabel(audience: LegalAudience): string | null {
  switch (audience) {
    case "guest":
      return "For stay guests";
    case "owner":
      return "For owners & managers";
    case "staff":
      return "For staff";
    case "agent":
      return "For AI agents";
    default:
      return null;
  }
}

export function legalPageHref(
  path: "/terms" | "/privacy",
  audience: LegalAudience,
): string {
  if (audience === "all") return path;
  return `${path}?for=${audience}`;
}

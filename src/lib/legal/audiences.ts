import type { UserRole } from "@/lib/design-tokens";

export const LEGAL_AUDIENCES = [
  "all",
  "guest",
  "owner",
  "employee",
  "staff",
] as const;

export type LegalAudience = (typeof LEGAL_AUDIENCES)[number];

export function parseLegalAudience(
  value: string | null | undefined,
): LegalAudience {
  if (value && (LEGAL_AUDIENCES as readonly string[]).includes(value)) {
    return value as LegalAudience;
  }
  return "all";
}

export function legalAudienceFromRole(role: UserRole): LegalAudience {
  if (role === "guest") return "guest";
  if (role === "owner" || role === "manager") return "owner";
  if (role === "cleaner") return "employee";
  if (role === "staff") return "staff";
  return "all";
}

export function legalAudienceLabel(audience: LegalAudience): string | null {
  switch (audience) {
    case "guest":
      return "For stay guests";
    case "owner":
      return "For owners & managers";
    case "employee":
      return "For cleaning team";
    case "staff":
      return "For field staff";
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

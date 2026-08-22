import { isCompanyEntitled } from "@/lib/billing/entitlement";
import type { OrgKind, UserRole } from "@/lib/design-tokens";
import type { Organization } from "@/lib/types";

/** Owners and managers on an active company Full/trial seat. */
export function canUseBasicReporting(input: {
  role: UserRole;
  orgKind: OrgKind | null | undefined;
  organization: Organization | null | undefined;
}): boolean {
  const { role, orgKind, organization } = input;
  if (orgKind !== "company") return false;
  if (!isCompanyEntitled(organization ?? null)) return false;
  return role === "owner" || role === "manager";
}

/** Default bill/task history window for limited (non-Basic) managers — 90 days. */
export const LIMITED_HISTORY_DAYS = 90;

export function historyCutoffIso(
  canUseExtendedHistory: boolean,
  now = new Date(),
): string | null {
  if (canUseExtendedHistory) return null;
  const d = new Date(now);
  d.setDate(d.getDate() - LIMITED_HISTORY_DAYS);
  return d.toISOString();
}

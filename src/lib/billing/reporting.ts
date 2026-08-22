import { isCompanyEntitled } from "@/lib/billing/entitlement";
import type { OrgKind, UserRole } from "@/lib/design-tokens";
import type { Organization } from "@/lib/types";

/** Owners and managers when the company Full plan or trial is active (included, not a separate purchase). */
export function canUseManagerReporting(input: {
  role: UserRole;
  orgKind: OrgKind | null | undefined;
  organization: Organization | null | undefined;
}): boolean {
  const { role, orgKind, organization } = input;
  if (orgKind !== "company") return false;
  if (!isCompanyEntitled(organization ?? null)) return false;
  return role === "owner" || role === "manager";
}

/** @deprecated Use canUseManagerReporting */
export const canUseBasicReporting = canUseManagerReporting;

/** Bill/task history window when Full is inactive — 90 days. */
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

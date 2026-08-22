import type { OrgKind } from "@/lib/design-tokens";
import type { UserRole } from "@/lib/design-tokens";

export function slugifyName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "member"
  );
}

export async function uniqueShareSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let slug = base;
  let i = 2;
  while (await exists(slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

export type RegisterWorkspaceInput = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  orgName: string;
  kind: OrgKind;
  /** Ignored if not owner; public register is owner-only. */
  role?: Extract<UserRole, "owner" | "manager">;
  /** Referrer share slug or profile id prefix from ?ref= */
  referredBy?: string | null;
};

export const COMPANY_TRIAL_DAYS = 30;

export function companyTrialEndsAt(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + COMPANY_TRIAL_DAYS);
  return d.toISOString();
}

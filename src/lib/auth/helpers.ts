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
  /** Company register: owner (pays) or manager (invites owner who pays). Personal ignores unless position is staff. */
  role?: Extract<UserRole, "owner" | "manager" | "staff" | "cleaner">;
  /** Referrer share slug or profile id prefix from ?ref= */
  referredBy?: string | null;
  /** Channel mark from ?src= / UTM (telegram_phuket, founder, …) */
  acquisitionSource?: string | null;
  /**
   * services host: maintenance = professional, management unused, customer = seeker.
   * app host: prefer `position` instead of maintenance/management cards.
   */
  track?: "maintenance" | "management" | "customer";
  /** App register: management (owner/manager path) or on-site staff. */
  position?: "management" | "staff";
  /** App/join: create a private Services listing / mark job_search interest. */
  listOnServices?: boolean;
  /** Who holds the company bill. Trial stays limited until that person has accepted, when it is not the registrant. */
  payer?: "owner" | "manager";
  service?: {
    skills?: string[];
    bio?: string;
    location?: string;
    country?: string;
    listNow?: boolean;
  };
  /** ISO time. Registration is refused without it. */
  termsAcceptedAt?: string | null;
  /** Optional email. Unset means no. */
  emailOptIn?: boolean;
  /** App on-site staff: company invite URL or /join token. Required for that path. */
  inviteToken?: string | null;
};

export const COMPANY_TRIAL_DAYS = 90;

export function companyTrialEndsAt(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + COMPANY_TRIAL_DAYS);
  return d.toISOString();
}

/** Pull a join token from a pasted invite URL, /join/token path, or bare token. */
export function inviteTokenFromLink(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const fromPath = text.match(/\/join\/([^/?#\s]+)/i);
  if (fromPath?.[1]) {
    try {
      return decodeURIComponent(fromPath[1]);
    } catch {
      return fromPath[1];
    }
  }
  if (/^[A-Za-z0-9_-]{16,128}$/.test(text)) return text;
  return null;
}

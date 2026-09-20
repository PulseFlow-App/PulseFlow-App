import type { Profile } from "@/lib/types";
import { canCastEndorsement } from "@/lib/roles";
import type { UserRole } from "@/lib/design-tokens";

/** Profile URL to leave a weekly review after confirming someone else's work. */
export function reviewOfferHref(
  doer: Pick<Profile, "id" | "share_slug"> | null | undefined,
  doerId: string,
) {
  const slug = doer?.share_slug?.trim();
  if (slug) return `/u/${encodeURIComponent(slug)}?review=1`;
  return `/endorsements?to=${encodeURIComponent(doerId)}`;
}

export function shouldOfferDoerReview(opts: {
  actorRole: UserRole;
  orgKind: "personal" | "company" | null;
  doerId: string | null | undefined;
  actorId: string;
}) {
  if (!opts.doerId || opts.doerId === opts.actorId) return false;
  return canCastEndorsement(opts.actorRole, opts.orgKind);
}

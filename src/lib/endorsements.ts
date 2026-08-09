import { endOfWeek, format, getISOWeek, getISOWeekYear, startOfWeek } from "date-fns";
import type { Endorsement, Organization, Profile } from "@/lib/types";

export function weekKey(date = new Date()) {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function weekLabel(key: string) {
  // key: 2026-W32
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return key;
  const year = Number(match[1]);
  const week = Number(match[2]);
  // Approximate: Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const start = startOfWeek(
    new Date(jan4.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000),
    { weekStartsOn: 1 },
  );
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`;
}

export type RatingSummary = {
  profileId: string;
  average: number;
  totalStars: number;
  voteCount: number;
  thisWeekStars: number | null;
};

export function summarizeRatings(
  endorsements: Endorsement[],
  profileId: string,
  currentWeek = weekKey(),
): RatingSummary {
  const mine = endorsements.filter((e) => e.to_profile_id === profileId);
  const voteCount = mine.length;
  const totalStars = mine.reduce((sum, e) => sum + e.stars, 0);
  const average = voteCount === 0 ? 0 : totalStars / voteCount;
  const thisWeek = mine.find((e) => e.week_key === currentWeek);
  return {
    profileId,
    average,
    totalStars,
    voteCount,
    thisWeekStars: thisWeek?.stars ?? null,
  };
}

export function leaderboardForOrg(
  endorsements: Endorsement[],
  profiles: Profile[],
  orgId: string,
  memberProfileIds?: Set<string>,
) {
  const employees = profiles.filter((p) => {
    if (p.role === "owner") return false;
    if (memberProfileIds) return memberProfileIds.has(p.id);
    return p.org_id === orgId;
  });
  return employees
    .map((p) => ({
      profile: p,
      rating: summarizeRatings(
        endorsements.filter((e) => e.org_id === orgId),
        p.id,
      ),
    }))
    .sort((a, b) => {
      if (b.rating.average !== a.rating.average) {
        return b.rating.average - a.rating.average;
      }
      return b.rating.voteCount - a.rating.voteCount;
    });
}

export function orgsForProfile(
  profileId: string,
  memberships: { profile_id: string; org_id: string }[],
  orgs: Organization[],
) {
  const ids = memberships
    .filter((m) => m.profile_id === profileId)
    .map((m) => m.org_id);
  return orgs.filter((o) => ids.includes(o.id) && o.kind === "company");
}

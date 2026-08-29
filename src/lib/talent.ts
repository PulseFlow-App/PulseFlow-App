import type { OrgKind, UserRole } from "@/lib/design-tokens";

/** Searchable service categories for the talent directory. */
export const TALENT_SKILLS = [
  "cleaner",
  "electrician",
  "ac",
  "plumber",
  "gardener",
  "pool",
  "maintenance",
  "handyman",
  "manager",
] as const;

export type TalentSkill = (typeof TALENT_SKILLS)[number];

export function canListInTalentSearch(role: UserRole) {
  return role === "cleaner" || role === "staff" || role === "manager";
}

export function normalizeTalentSkills(raw: string[] | null | undefined): TalentSkill[] {
  if (!raw?.length) return [];
  const allowed = new Set<string>(TALENT_SKILLS);
  return raw.filter((s): s is TalentSkill => allowed.has(s));
}

export type TalentSearchResult = {
  id: string;
  full_name: string;
  job_title: string | null;
  role: UserRole;
  share_slug: string;
  job_search_skills: TalentSkill[];
  job_search_bio: string | null;
  average_rating: number;
  review_count: number;
};

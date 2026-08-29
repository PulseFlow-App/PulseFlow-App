import type { UserRole } from "@/lib/design-tokens";

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

export function normalizeLocationLabel(raw: string | null | undefined) {
  const value = raw?.trim() ?? "";
  return value ? value.slice(0, 120) : null;
}

export function normalizeCountryLabel(raw: string | null | undefined) {
  const value = raw?.trim() ?? "";
  return value ? value.slice(0, 80) : null;
}

export function formatTalentPlace(input: {
  job_search_location?: string | null;
  job_search_country?: string | null;
}) {
  const city = input.job_search_location?.trim() || "";
  const country = input.job_search_country?.trim() || "";
  if (city && country) return `${city}, ${country}`;
  return city || country || null;
}

/** Approximate km between two WGS84 points. */
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type TalentSearchResult = {
  id: string;
  full_name: string;
  job_title: string | null;
  role: UserRole;
  share_slug: string;
  job_search_skills: TalentSkill[];
  job_search_bio: string | null;
  job_search_location: string | null;
  job_search_country: string | null;
  job_search_lat: number | null;
  job_search_lng: number | null;
  average_rating: number;
  review_count: number;
  /** Present when searching near a point */
  distance_km: number | null;
};

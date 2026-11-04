import type { UserRole } from "@/lib/design-tokens";

/** Professions a person can list on Pulseflow Services. */
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
  "babysitter",
  "pet-sitter",
] as const;

export type TalentSkill = (typeof TALENT_SKILLS)[number];

export function canListInTalentSearch(role: UserRole) {
  return role === "cleaner" || role === "staff" || role === "manager";
}

/** Services settings can list an owner as well as field staff. Guests stay off the directory. */
export function canListOnServices(role: UserRole) {
  return canListInTalentSearch(role) || role === "owner";
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

const WORK_TAG_SUGGESTIONS: Record<string, string[]> = {
  cleaner: ["Karcher", "Hoover", "Windows", "Laundry", "Turnover"],
  cleaning: ["Karcher", "Hoover", "Windows", "Laundry", "Turnover"],
  "deep-cleaning": ["Deep clean", "Karcher", "Hoover", "Move-out"],
  electrician: ["Wiring", "Lights", "Fans", "Breakers"],
  electrical: ["Wiring", "Lights", "Fans", "Breakers"],
  ac: ["Unit cleaning", "Gas refill", "Installation"],
  hvac: ["Unit cleaning", "Gas refill", "Installation"],
  plumber: ["Leaks", "Pumps", "Water heaters"],
  plumbing: ["Leaks", "Pumps", "Water heaters"],
  gardener: ["Lawn", "Trees", "Watering"],
  gardening: ["Lawn", "Trees", "Watering"],
  pool: ["Chemicals", "Pumps", "Tiles"],
  maintenance: ["Small repairs", "Mounting", "Furniture", "House build"],
  handyman: ["Small repairs", "Mounting", "Furniture", "House build"],
  carpentry: ["Furniture", "House build", "Doors", "Decks"],
  construction: ["House build", "Renovation", "Tiling"],
  painting: ["Interior", "Exterior"],
  appliance: ["Fridges", "Washers", "Ovens"],
  pest: ["Ants", "Termites", "Rodents"],
  water: ["Pumps", "Tanks", "Filters"],
  locksmith: ["Locks", "Keys"],
  moving: ["Furniture", "Local delivery"],
  babysitter: ["Evenings", "Infants", "School age"],
  babysitting: ["Evenings", "Infants", "School age"],
  "pet-sitter": ["Dogs", "Cats", "Feeding"],
  "pet-sitting": ["Dogs", "Cats", "Feeding"],
};

/** Short labels for tools and kinds of work, kept as the person typed them. */
export function normalizeWorkTags(raw: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw ?? []) {
    const value = item.replace(/\s+/g, " ").trim().slice(0, 32);
    if (value.length < 2) continue;
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= 12) break;
  }
  return out;
}

/** Suggestions for the trades they already picked. Keys are skill ids or category slugs. */
export function suggestedWorkTags(keys: string[]): string[] {
  const out: string[] = [];
  for (const key of keys) {
    for (const tag of WORK_TAG_SUGGESTIONS[key] ?? []) {
      if (!out.some((row) => row.toLocaleLowerCase() === tag.toLocaleLowerCase())) out.push(tag);
    }
  }
  return out.slice(0, 12);
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
  job_search_tags: string[];
  job_search_bio: string | null;
  job_search_location: string | null;
  job_search_country: string | null;
  job_search_lat: number | null;
  job_search_lng: number | null;
  average_rating: number;
  review_count: number;
  /** Present when searching near a point */
  distance_km: number | null;
  /** Already a member of the viewer's company. */
  on_team?: boolean;
  /** Already a Contacts row for the viewer's company. */
  in_contacts?: boolean;
};

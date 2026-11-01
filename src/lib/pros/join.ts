import { AREAS, CATEGORIES, createSeedState } from "@/lib/pros/catalog";
import { readProsState, writeProsState } from "@/lib/pros/jobs";
import type { ProProfile } from "@/lib/pros/types";

export const SIGNUP_LOG_KEY = "pulseflow.signups.v1";
export const SERVICE_PROFILE_KEY = "pulseflow.services.profile";

const SKILL_BY_SLUG: Record<string, string> = {
  hvac: "ac",
  plumbing: "plumber",
  electrical: "electrician",
  cleaning: "cleaner",
  "deep-cleaning": "cleaner",
  pool: "pool",
  gardening: "gardener",
  handyman: "handyman",
};

export type SignupRow = {
  id: string;
  at: string;
  name: string;
  email: string;
  track: "maintenance" | "management";
  plan: "personal" | "company" | "maintenance";
  role: string | null;
  payer: string | null;
  referrer: string | null;
};

export function talentSkillsForCategories(ids: string[]) {
  const skills = new Set<string>();
  for (const id of ids) {
    const slug = CATEGORIES.find((row) => row.id === id)?.slug;
    const skill = slug ? SKILL_BY_SLUG[slug] : undefined;
    if (skill) skills.add(skill);
  }
  if (!skills.size) skills.add("maintenance");
  return [...skills];
}

export function areaLabels(ids: string[]) {
  return ids
    .map((id) => AREAS.find((row) => row.id === id)?.names.en)
    .filter((name): name is string => Boolean(name));
}

export function readSignups(): SignupRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIGNUP_LOG_KEY);
    const parsed = raw ? (JSON.parse(raw) as SignupRow[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordSignup(input: Omit<SignupRow, "id" | "at">) {
  const row: SignupRow = {
    ...input,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };
  const next = [row, ...readSignups()].slice(0, 200);
  localStorage.setItem(SIGNUP_LOG_KEY, JSON.stringify(next));
  return row;
}

export function joinProfessional(input: {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  lineId: string;
  description: string;
  availability: string;
  categoryIds: string[];
  areaIds: string[];
  languages: string[];
  listNow: boolean;
  referrer: string | null;
}) {
  const state = readProsState() ?? createSeedState();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const about = [input.description.trim(), input.availability.trim() ? `Available: ${input.availability.trim()}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const profile: ProProfile = {
    id,
    contactId: null,
    orgId: null,
    linkedProfileId: null,
    name: input.name.trim(),
    description: about,
    descriptionLocale: "en",
    translations: {},
    photoUrl: null,
    photos: [],
    categoryIds: input.categoryIds,
    areaIds: input.areaIds,
    languages: input.languages.length ? input.languages : ["en"],
    phone: input.phone.trim() || null,
    lineId: input.lineId.trim() || null,
    whatsapp: input.whatsapp.trim() || null,
    visibility: input.listNow ? "public" : "private",
    status: "active",
    available: true,
    consentAt: input.listNow ? now : null,
    consentBy: null,
    consentNote: input.listNow ? "Opened the listing at registration." : null,
    claimToken: crypto.randomUUID(),
    claimedAt: now,
    listingTier: "free",
    checks: { email: null, phone: null, identity: null, business: null, qualification: null },
    createdAt: now,
  };
  state.profiles = [profile, ...state.profiles.filter((row) => row.id !== id)];
  state.events = [
    {
      id: crypto.randomUUID(),
      name: "signup",
      actorId: null,
      ref: input.referrer,
      at: now,
    },
    ...state.events,
  ];
  writeProsState(state);
  localStorage.setItem(SERVICE_PROFILE_KEY, id);
  recordSignup({
    name: profile.name,
    email: input.email.trim(),
    track: "maintenance",
    plan: "maintenance",
    role: "staff",
    payer: null,
    referrer: input.referrer,
  });
  return { id };
}

export function updateServiceListing(patch: {
  description?: string;
  availability?: string;
  visibility?: "private" | "public";
  whatsapp?: string | null;
  lineId?: string | null;
  languages?: string[];
  phone?: string | null;
}) {
  if (typeof window === "undefined") return false;
  const id = localStorage.getItem(SERVICE_PROFILE_KEY);
  if (!id) return false;
  const state = readProsState();
  if (!state) return false;
  const row = state.profiles.find((profile) => profile.id === id);
  if (!row) return false;
  if (patch.description != null || patch.availability != null) {
    const base = (patch.description ?? row.description).replace(/\n\nAvailable:[\s\S]*$/, "").trim();
    const when = patch.availability?.trim();
    row.description = when ? `${base}\n\nAvailable: ${when}` : base;
  }
  if (patch.visibility) {
    row.visibility = patch.visibility;
    if (patch.visibility === "public" && !row.consentAt) {
      row.consentAt = new Date().toISOString();
      row.consentNote = "Opened the listing from settings.";
    }
  }
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (patch.lineId !== undefined) row.lineId = patch.lineId;
  if (patch.languages) row.languages = patch.languages;
  if (patch.phone !== undefined) row.phone = patch.phone;
  writeProsState(state);
  return true;
}

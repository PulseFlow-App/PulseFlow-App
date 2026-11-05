import { NextResponse } from "next/server";
import { AREAS, CATEGORIES } from "@/lib/pros/catalog";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const CATEGORY_BY_SKILL: Record<string, string> = {
  ac: "hvac",
  plumber: "plumbing",
  electrician: "electrical",
  cleaner: "cleaning",
  pool: "pool",
  gardener: "gardening",
  handyman: "handyman",
  maintenance: "handyman",
  manager: "other",
  babysitter: "babysitting",
  "pet-sitter": "pet-sitting",
};

function areaIdsFor(location: string) {
  const text = location.toLowerCase();
  if (!text.trim()) return [];
  return AREAS.filter((area) => {
    if (area.level === "country" || area.level === "region") return false;
    const name = area.names.en.toLowerCase();
    if (text.includes(name)) return true;
    const short = name.replace(/^koh /, "");
    return short.length > 3 && text.includes(short);
  }).map((area) => area.id);
}

/** People who already listed on Pulseflow Services. No phone or email. */
export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ profiles: [] });
  }

  const admin = createAdminClient();
  const columns =
    "id, full_name, job_search_bio, job_search_skills, job_search_tags, job_search_location, job_search_country, job_search_updated_at";
  const withLogo = await admin
    .from("profiles")
    .select(`${columns}, logo_url`)
    .eq("job_search_visible", true)
    .order("job_search_updated_at", { ascending: false })
    .limit(500);
  const result =
    withLogo.error && /logo_url/.test(withLogo.error.message)
      ? await admin
          .from("profiles")
          .select(columns)
          .eq("job_search_visible", true)
          .order("job_search_updated_at", { ascending: false })
          .limit(500)
      : withLogo;
  if (result.error || !result.data) {
    return NextResponse.json({ profiles: [] });
  }
  const data = result.data as Array<{
    id: string;
    full_name: string;
    job_search_bio: string | null;
    job_search_skills: string[] | null;
    job_search_tags: string[] | null;
    job_search_location: string | null;
    job_search_country: string | null;
    job_search_updated_at: string | null;
    logo_url?: string | null;
  }>;

  const profiles = data.map((row) => {
    const skills = Array.isArray(row.job_search_skills) ? row.job_search_skills : [];
    const categoryIds = [
      ...new Set(
        skills
          .map((skill) => CATEGORIES.find((category) => category.slug === CATEGORY_BY_SKILL[String(skill)])?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const location = [row.job_search_location, row.job_search_country].filter(Boolean).join(", ");
    const areaIds = areaIdsFor(location);
    return {
      id: row.id,
      contactId: null,
      orgId: null,
      linkedProfileId: row.id,
      name: row.full_name,
      description: row.job_search_bio ?? "",
      descriptionLocale: "en",
      translations: {},
      photoUrl:
        typeof row.logo_url === "string" && row.logo_url.startsWith("http") ? row.logo_url : null,
      photos: [],
      categoryIds: categoryIds.length ? categoryIds : [CATEGORIES.find((c) => c.slug === "other")!.id],
      areaIds,
      languages: ["en"],
      phone: null,
      lineId: null,
      whatsapp: null,
      visibility: "public",
      status: "active",
      available: true,
      consentAt: row.job_search_updated_at,
      consentBy: null,
      consentNote: "Listed on Pulseflow Services.",
      claimToken: row.id,
      claimedAt: row.job_search_updated_at,
      listingTier: "free",
      checks: { email: null, phone: null, identity: null, business: null, qualification: null },
      tags: Array.isArray(row.job_search_tags) ? row.job_search_tags.map(String) : [],
      createdAt: row.job_search_updated_at ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ profiles });
}

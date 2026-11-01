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

/** People who already listed on Pulse Flow Services. No phone or email. */
export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ profiles: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, full_name, job_search_bio, job_search_skills, job_search_location, job_search_country, job_search_updated_at",
    )
    .eq("job_search_visible", true)
    .order("job_search_updated_at", { ascending: false })
    .limit(500);
  if (error || !data) {
    return NextResponse.json({ profiles: [] });
  }

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
      photoUrl: null,
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
      consentNote: "Listed on Pulse Flow Services.",
      claimToken: row.id,
      claimedAt: row.job_search_updated_at,
      listingTier: "free",
      checks: { email: null, phone: null, identity: null, business: null, qualification: null },
      createdAt: row.job_search_updated_at ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ profiles });
}

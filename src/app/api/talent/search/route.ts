import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/env";
import {
  distanceKm,
  normalizeTalentSkills,
  type TalentSearchResult,
} from "@/lib/talent";
import {
  matchesTalentCountry,
  matchesTalentPlace,
} from "@/lib/talent/places";
import { canBrowseTalent } from "@/lib/roles";
import type { UserRole } from "@/lib/design-tokens";
import type { Endorsement, Organization, Profile } from "@/lib/types";
import { getDemoStore } from "@/lib/demo/store";

function collectPlaceFacets(
  profiles: Array<{
    job_search_country?: string | null;
    job_search_location?: string | null;
  }>,
) {
  const countries = [
    ...new Set(
      profiles
        .map((p) => p.job_search_country?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const locations = [
    ...new Set(
      profiles
        .map((p) => p.job_search_location?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  ].sort((a, b) => a.localeCompare(b));
  return { countries, locations };
}

function averageStars(endorsements: Endorsement[], profileId: string) {
  const mine = endorsements.filter((e) => e.to_profile_id === profileId);
  if (!mine.length) return { average: 0, count: 0 };
  const total = mine.reduce((sum, e) => sum + e.stars, 0);
  return { average: total / mine.length, count: mine.length };
}

function toResult(
  p: Profile,
  endorsements: Endorsement[],
  near: { lat: number; lng: number; radiusKm: number } | null,
): TalentSearchResult | null {
  const { average, count } = averageStars(endorsements, p.id);
  let distance_km: number | null = null;
  if (near && p.job_search_lat != null && p.job_search_lng != null) {
    distance_km = distanceKm(
      near.lat,
      near.lng,
      p.job_search_lat,
      p.job_search_lng,
    );
    if (distance_km > near.radiusKm) return null;
  } else if (near) {
    return null;
  }
  return {
    id: p.id,
    full_name: p.full_name,
    job_title: p.job_title,
    role: p.role,
    share_slug: p.share_slug,
    job_search_skills: normalizeTalentSkills(p.job_search_skills),
    job_search_bio: p.job_search_bio,
    job_search_location: p.job_search_location ?? null,
    job_search_country: p.job_search_country ?? null,
    job_search_lat: p.job_search_lat ?? null,
    job_search_lng: p.job_search_lng ?? null,
    average_rating: average,
    review_count: count,
    distance_km,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const skill = url.searchParams.get("skill")?.trim().toLowerCase() ?? "";
  const location = url.searchParams.get("location")?.trim().toLowerCase() ?? "";
  const country = url.searchParams.get("country")?.trim().toLowerCase() ?? "";
  const nearLat = Number(url.searchParams.get("near_lat"));
  const nearLng = Number(url.searchParams.get("near_lng"));
  const radiusKm = Math.min(
    Math.max(Number(url.searchParams.get("radius_km") ?? 80) || 80, 5),
    500,
  );
  const near =
    Number.isFinite(nearLat) && Number.isFinite(nearLng)
      ? { lat: nearLat, lng: nearLng, radiusKm }
      : null;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 40), 60);

  if (isDemoMode()) {
    const store = getDemoStore();
    let profiles = store.profiles.filter(
      (p) =>
        p.job_search_visible &&
        (p.role === "cleaner" || p.role === "staff" || p.role === "manager"),
    );
    if (skill) {
      profiles = profiles.filter((p) =>
        (p.job_search_skills ?? []).includes(skill),
      );
    }
    if (country) {
      profiles = profiles.filter((p) =>
        matchesTalentCountry(country, p.job_search_country),
      );
    }
    if (location) {
      profiles = profiles.filter((p) =>
        matchesTalentPlace(location, p.job_search_location, p.job_search_country),
      );
    }
    if (q) {
      profiles = profiles.filter((p) => {
        const hay = [
          p.full_name,
          p.job_title ?? "",
          p.job_search_bio ?? "",
          p.job_search_location ?? "",
          p.job_search_country ?? "",
          ...(p.job_search_skills ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const results = profiles
      .map((p) => toResult(p, store.endorsements, near))
      .filter((r): r is TalentSearchResult => Boolean(r))
      .slice(0, limit);
    results.sort((a, b) => {
      if (a.distance_km != null && b.distance_km != null) {
        return a.distance_km - b.distance_km;
      }
      if (b.average_rating !== a.average_rating) {
        return b.average_rating - a.average_rating;
      }
      return a.full_name.localeCompare(b.full_name);
    });
    const facets = collectPlaceFacets(
      store.profiles.filter(
        (p) =>
          p.job_search_visible &&
          (p.role === "cleaner" || p.role === "staff" || p.role === "manager"),
      ),
    );
    return NextResponse.json({
      results,
      countries: facets.countries,
      locations: facets.locations,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: viewer, error: viewerError } = await admin
    .from("profiles")
    .select("id, role, org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (viewerError || !viewer) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: viewerOrg } = await admin
    .from("organizations")
    .select("kind")
    .eq("id", viewer.org_id)
    .maybeSingle();

  if (!canBrowseTalent(viewer.role as UserRole, viewerOrg?.kind as Organization["kind"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = admin
    .from("profiles")
    .select(
      "id, full_name, job_title, role, share_slug, job_search_skills, job_search_bio, job_search_location, job_search_country, job_search_lat, job_search_lng",
    )
    .eq("job_search_visible", true)
    .in("role", ["cleaner", "staff", "manager"])
    .order("full_name")
    .limit(Math.min(limit * 3, 120));

  if (skill) {
    query = query.contains("job_search_skills", [skill]);
  }
  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = ((rows as Profile[]) ?? []).map((row) => ({
    ...row,
    job_search_lat:
      row.job_search_lat == null ? null : Number(row.job_search_lat),
    job_search_lng:
      row.job_search_lng == null ? null : Number(row.job_search_lng),
  }));

  const filtered = profiles.filter((p) => {
    if (country && !matchesTalentCountry(country, p.job_search_country)) {
      return false;
    }
    if (
      location &&
      !matchesTalentPlace(location, p.job_search_location, p.job_search_country)
    ) {
      return false;
    }
    if (!q) return true;
    const hay = [
      p.full_name,
      p.job_title ?? "",
      p.job_search_bio ?? "",
      p.job_search_location ?? "",
      p.job_search_country ?? "",
      ...(p.job_search_skills ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const ids = filtered.map((p) => p.id);
  let endorsements: Endorsement[] = [];
  if (ids.length) {
    const { data: endorsementRows } = await admin
      .from("endorsements")
      .select("*")
      .in("to_profile_id", ids);
    endorsements = (endorsementRows as Endorsement[]) ?? [];
  }

  const results = filtered
    .map((p) => toResult(p, endorsements, near))
    .filter((r): r is TalentSearchResult => Boolean(r))
    .slice(0, limit);

  results.sort((a, b) => {
    if (a.distance_km != null && b.distance_km != null) {
      return a.distance_km - b.distance_km;
    }
    if (b.average_rating !== a.average_rating) {
      return b.average_rating - a.average_rating;
    }
    return a.full_name.localeCompare(b.full_name);
  });

  const { data: facetRows } = await admin
    .from("profiles")
    .select("job_search_country, job_search_location")
    .eq("job_search_visible", true)
    .in("role", ["cleaner", "staff", "manager"]);

  const facets = collectPlaceFacets(
    (facetRows as Array<{
      job_search_country: string | null;
      job_search_location: string | null;
    }> | null) ?? [],
  );

  return NextResponse.json({
    results,
    countries: facets.countries,
    locations: facets.locations,
  });
}

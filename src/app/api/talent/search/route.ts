import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/env";
import { normalizeTalentSkills, type TalentSearchResult } from "@/lib/talent";
import { canBrowseTalent } from "@/lib/roles";
import type { UserRole } from "@/lib/design-tokens";
import type { Endorsement, Organization, Profile } from "@/lib/types";

function averageStars(endorsements: Endorsement[], profileId: string) {
  const mine = endorsements.filter((e) => e.to_profile_id === profileId);
  if (!mine.length) return { average: 0, count: 0 };
  const total = mine.reduce((sum, e) => sum + e.stars, 0);
  return { average: total / mine.length, count: mine.length };
}

export async function GET(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ results: [] satisfies TalentSearchResult[] });
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

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const skill = url.searchParams.get("skill")?.trim().toLowerCase() ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 40), 60);

  let query = admin
    .from("profiles")
    .select(
      "id, full_name, job_title, role, share_slug, job_search_skills, job_search_bio",
    )
    .eq("job_search_visible", true)
    .in("role", ["cleaner", "staff", "manager"])
    .order("full_name")
    .limit(limit);

  if (skill) {
    query = query.contains("job_search_skills", [skill]);
  }

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = (rows as Profile[]) ?? [];
  const filtered = q
    ? profiles.filter((p) => {
        const hay = [
          p.full_name,
          p.job_title ?? "",
          p.job_search_bio ?? "",
          ...(p.job_search_skills ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : profiles;

  const ids = filtered.map((p) => p.id);
  let endorsements: Endorsement[] = [];
  if (ids.length) {
    const { data: endorsementRows } = await admin
      .from("endorsements")
      .select("*")
      .in("to_profile_id", ids);
    endorsements = (endorsementRows as Endorsement[]) ?? [];
  }

  const results: TalentSearchResult[] = filtered.map((p) => {
    const { average, count } = averageStars(endorsements, p.id);
    return {
      id: p.id,
      full_name: p.full_name,
      job_title: p.job_title,
      role: p.role,
      share_slug: p.share_slug,
      job_search_skills: normalizeTalentSkills(p.job_search_skills),
      job_search_bio: p.job_search_bio,
      average_rating: average,
      review_count: count,
    };
  });

  results.sort((a, b) => {
    if (b.average_rating !== a.average_rating) {
      return b.average_rating - a.average_rating;
    }
    return a.full_name.localeCompare(b.full_name);
  });

  return NextResponse.json({ results });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Endorsement,
  OrgMembership,
  Organization,
  Profile,
} from "@/lib/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const clean = slug?.trim().toLowerCase();
  if (!clean) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select(
        "id, full_name, role, org_id, job_title, share_slug, job_search_visible, job_search_location, job_search_country, job_search_skills, job_search_bio",
      )
      .eq("share_slug", clean)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!profile || profile.role === "owner") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const publicProfile = profile as Profile;
    const showTalent = Boolean(publicProfile.job_search_visible);

    // Do not expose org_id or membership rows publicly (feeds privilege escalation).
    const [
      { data: endorsements },
      { data: tasksDoneRows },
      { data: tasksOpenRows },
      { data: orgNameRow },
    ] = await Promise.all([
      admin
        .from("endorsements")
        .select("id, from_profile_id, to_profile_id, stars, week_key, created_at")
        .eq("to_profile_id", publicProfile.id),
      admin
        .from("tasks")
        .select("id")
        .eq("assigned_to", publicProfile.id)
        .eq("status", "done"),
      admin
        .from("tasks")
        .select("id")
        .eq("assigned_to", publicProfile.id)
        .eq("status", "open"),
      publicProfile.org_id
        ? admin
            .from("organizations")
            .select("name, kind")
            .eq("id", publicProfile.org_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const safeEndorsements = ((endorsements as Endorsement[]) ?? []).map(
      (e) => ({
        ...e,
        org_id: "public",
      }),
    );

    return NextResponse.json({
      profile: {
        id: publicProfile.id,
        full_name: publicProfile.full_name,
        role: publicProfile.role,
        org_id: "public",
        personal_org_id: null,
        phone: null,
        email: "",
        job_title: publicProfile.job_title,
        share_slug: publicProfile.share_slug,
        job_search_visible: publicProfile.job_search_visible,
        job_search_location: showTalent
          ? publicProfile.job_search_location
          : null,
        job_search_country: showTalent
          ? publicProfile.job_search_country
          : null,
        job_search_skills: showTalent
          ? publicProfile.job_search_skills ?? []
          : [],
        job_search_bio: showTalent ? publicProfile.job_search_bio : null,
        job_search_lat: null,
        job_search_lng: null,
        job_search_updated_at: null,
      } satisfies Profile,
      endorsements: safeEndorsements,
      memberships: [] as OrgMembership[],
      orgs: orgNameRow
        ? ([
            {
              id: "public",
              name: (orgNameRow as { name: string; kind: string }).name,
              kind: (orgNameRow as { name: string; kind: Organization["kind"] })
                .kind,
              created_at: "",
            },
          ] satisfies Organization[])
        : [],
      tasksDone: tasksDoneRows?.length ?? 0,
      tasksOpen: tasksOpenRows?.length ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

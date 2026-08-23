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
        "id, full_name, role, email, org_id, personal_org_id, phone, job_title, share_slug",
      )
      .eq("share_slug", clean)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );
    }
    if (!profile || profile.role === "owner") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [
      { data: endorsements },
      { data: memberships },
      { data: tasksDoneRows },
      { data: tasksOpenRows },
    ] = await Promise.all([
      admin
        .from("endorsements")
        .select("*")
        .eq("to_profile_id", profile.id),
      admin
        .from("org_memberships")
        .select("*")
        .eq("profile_id", profile.id),
      admin
        .from("tasks")
        .select("id")
        .eq("assigned_to", profile.id)
        .eq("status", "done"),
      admin
        .from("tasks")
        .select("id")
        .eq("assigned_to", profile.id)
        .eq("status", "open"),
    ]);

    const orgIds = [
      ...new Set(
        [
          profile.org_id,
          ...(memberships ?? []).map((m: OrgMembership) => m.org_id),
        ].filter(Boolean),
      ),
    ] as string[];

    let orgs: Organization[] = [];
    if (orgIds.length) {
      const { data: orgRows } = await admin
        .from("organizations")
        .select("*")
        .in("id", orgIds);
      orgs = (orgRows as Organization[]) ?? [];
    }

    return NextResponse.json({
      profile: profile as Profile,
      endorsements: (endorsements as Endorsement[]) ?? [],
      memberships: (memberships as OrgMembership[]) ?? [],
      orgs,
      tasksDone: tasksDoneRows?.length ?? 0,
      tasksOpen: tasksOpenRows?.length ?? 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

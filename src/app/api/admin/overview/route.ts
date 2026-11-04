import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/env";
import { ADMIN_COOKIE, tokenMatches } from "@/lib/pros/admin-lock";

type RoleCount = Record<string, number>;

function bump(map: RoleCount, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

/** Combined Property ops + Services snapshot for the unlocked admin panel. */
export async function GET() {
  const jar = await cookies();
  if (!tokenMatches(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  if (isDemoMode()) {
    return NextResponse.json({
      demo: true,
      propertyOps: null,
      servicesDb: null,
      traffic: {
        marketing: "https://plausible.io/www.pulseflow.site",
        note: "Open Plausible for marketing traffic. Demo mode has no live registrations.",
      },
    });
  }

  const admin = createAdminClient();

  const [
    profilesCount,
    orgsCount,
    villasCount,
    referralsCount,
    proProfilesCount,
    serviceRequestsCount,
    recentMemberships,
    recentOrgs,
    recentPros,
    allRoles,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("organizations").select("id", { count: "exact", head: true }),
    admin.from("villas").select("id", { count: "exact", head: true }),
    admin.from("referral_credits").select("id", { count: "exact", head: true }),
    admin.from("pro_profiles").select("id", { count: "exact", head: true }),
    admin.from("service_requests").select("id", { count: "exact", head: true }),
    admin
      .from("org_memberships")
      .select("joined_at, role, profile_id, org_id")
      .order("joined_at", { ascending: false })
      .limit(40),
    admin
      .from("organizations")
      .select("id, name, created_at, acquisition_source")
      .order("created_at", { ascending: false })
      .limit(25),
    admin
      .from("pro_profiles")
      .select("id, display_name, status, visibility, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    admin.from("profiles").select("role"),
  ]);

  const membershipRows = recentMemberships.error ? [] : (recentMemberships.data ?? []);
  const profileIds = [...new Set(membershipRows.map((row) => row.profile_id))];
  const { data: profileRows } = profileIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, email, role, share_slug")
        .in("id", profileIds)
    : { data: [] as { id: string; full_name: string; email: string | null; role: string; share_slug: string | null }[] };

  const byProfile = new Map((profileRows ?? []).map((row) => [row.id, row]));
  const allRoleCounts: RoleCount = {};
  for (const row of allRoles.data ?? []) bump(allRoleCounts, row.role || "unknown");

  return NextResponse.json({
    demo: false,
    propertyOps: {
      profiles: profilesCount.count ?? 0,
      organizations: orgsCount.count ?? 0,
      villas: villasCount.count ?? 0,
      referrals: referralsCount.count ?? 0,
      roles: allRoleCounts,
      recentPeople: membershipRows.map((row) => {
        const profile = byProfile.get(row.profile_id);
        return {
          id: row.profile_id,
          at: row.joined_at,
          role: profile?.role ?? row.role,
          name: profile?.full_name ?? "Unknown",
          email: profile?.email ?? null,
          shareSlug: profile?.share_slug ?? null,
          orgId: row.org_id,
        };
      }),
      recentOrganizations: (recentOrgs.error ? [] : recentOrgs.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        at: row.created_at,
        source: row.acquisition_source ?? null,
      })),
    },
    servicesDb: {
      proProfiles: proProfilesCount.error ? 0 : (proProfilesCount.count ?? 0),
      serviceRequests: serviceRequestsCount.error ? 0 : (serviceRequestsCount.count ?? 0),
      recentPros: (recentPros.error ? [] : recentPros.data ?? []).map((row) => ({
        id: row.id,
        name: row.display_name,
        status: row.status,
        visibility: row.visibility,
        at: row.created_at,
      })),
    },
    traffic: {
      marketing: "https://plausible.io/www.pulseflow.site",
      note: "Site traffic is in Plausible. App usage is summarized above from live registrations.",
    },
  });
}

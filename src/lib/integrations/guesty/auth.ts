import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireGuestyManager(orgId?: string | null): Promise<{
  userId: string;
  profileId: string;
  orgId: string;
  role: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, org_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    throw Object.assign(new Error("Profile not found"), { status: 403 });
  }

  const targetOrg = orgId?.trim() || (profile.org_id as string);
  if (!targetOrg) {
    throw Object.assign(new Error("No company selected"), { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, kind")
    .eq("id", targetOrg)
    .maybeSingle();

  if (!org || org.kind !== "company") {
    throw Object.assign(
      new Error("Guesty connects to a company workspace only"),
      { status: 400 },
    );
  }

  const { data: membership } = await admin
    .from("org_memberships")
    .select("role")
    .eq("org_id", targetOrg)
    .eq("profile_id", profile.id)
    .maybeSingle();

  const role =
    (membership?.role as string | undefined) ||
    (profile.org_id === targetOrg ? (profile.role as string) : "");

  if (role !== "owner" && role !== "manager") {
    throw Object.assign(
      new Error("Only owners and managers can connect Guesty"),
      { status: 403 },
    );
  }

  return {
    userId: user.id,
    profileId: profile.id as string,
    orgId: targetOrg,
    role,
  };
}

export function jsonError(err: unknown) {
  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status: number }).status) || 500
      : 500;
  const message = err instanceof Error ? err.message : "Something went wrong";
  return { status, message };
}

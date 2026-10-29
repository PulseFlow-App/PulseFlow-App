/**
 * Ensure a bookable Contacts row exists for a staff profile in a company org.
 */

type AdminLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

export type StaffContactProfile = {
  id: string;
  full_name: string;
  phone?: string | null;
  job_title?: string | null;
  role?: string | null;
  job_search_skills?: string[] | null;
};

function contactRoleFromProfile(profile: StaffContactProfile): string {
  const title = profile.job_title?.trim();
  if (title) return title;
  const skill = profile.job_search_skills?.find((s) => s.trim());
  if (skill) return skill;
  if (profile.role === "cleaner") return "cleaning";
  if (profile.role === "manager") return "manager";
  return "staff";
}

/** Upsert org contact linked to profile so owners can book them from Contacts. */
export async function ensureStaffContact(
  admin: AdminLike,
  input: { orgId: string; profile: StaffContactProfile },
): Promise<{ id: string; created: boolean }> {
  const { data: existing } = await admin
    .from("contacts")
    .select("id")
    .eq("org_id", input.orgId)
    .eq("linked_profile_id", input.profile.id)
    .maybeSingle();

  if (existing?.id) {
    return { id: String(existing.id), created: false };
  }

  const { data: inserted, error } = await admin
    .from("contacts")
    .insert({
      org_id: input.orgId,
      name: input.profile.full_name?.trim() || "Teammate",
      role: contactRoleFromProfile(input.profile),
      phone: input.profile.phone?.trim() || null,
      messenger: "none",
      messenger_handle: null,
      messengers: [],
      notes: null,
      linked_profile_id: input.profile.id,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    throw new Error(error?.message ?? "Could not add contact.");
  }
  return { id: String(inserted.id), created: true };
}

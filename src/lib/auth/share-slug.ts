import type { SupabaseClient } from "@supabase/supabase-js";
import { slugifyName, uniqueShareSlug } from "@/lib/auth/helpers";

type ProfileRow = {
  id: string;
  full_name: string;
  share_slug: string | null;
  role: string;
};

/** Non-owners need a stable public slug for /u/[slug]. Owners stay private. */
export async function ensureProfileShareSlug(
  admin: SupabaseClient,
  profile: ProfileRow,
): Promise<string | null> {
  if (profile.role === "owner") return null;

  const existing = profile.share_slug?.trim();
  if (existing) return existing;

  const share_slug = await uniqueShareSlug(
    slugifyName(profile.full_name || "member"),
    async (slug) => {
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("share_slug", slug)
        .maybeSingle();
      return Boolean(data);
    },
  );

  const { error } = await admin
    .from("profiles")
    .update({ share_slug })
    .eq("id", profile.id);

  if (error) throw new Error(error.message);
  return share_slug;
}

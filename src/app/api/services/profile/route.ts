import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import {
  canListOnServices,
  normalizeCountryLabel,
  normalizeLocationLabel,
  normalizeTalentSkills,
  normalizeWorkTags,
} from "@/lib/talent";
import { storeAccountLogo } from "@/lib/auth/logo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/design-tokens";

export const runtime = "nodejs";

const FIELDS =
  "id, role, full_name, job_search_visible, job_search_skills, job_search_tags, job_search_bio, job_search_location, job_search_country, nationality";

const patchSchema = z
  .object({
    confirmThai: z.literal(true).optional(),
    visible: z.boolean().optional(),
    skills: z.array(z.string()).max(12).optional(),
    tags: z.array(z.string()).max(12).optional(),
    bio: z.string().max(500).nullable().optional(),
    logo: z.string().max(2_000_000).nullable().optional(),
    location: z.string().max(120).nullable().optional(),
    country: z.string().max(80).nullable().optional(),
    nationality: z.string().max(80).nullable().optional(),
  })
  .refine((body) => body.confirmThai === true || typeof body.visible === "boolean");

async function signedInProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  let { data, error } = await admin
    .from("profiles")
    .select(`${FIELDS}, logo_url`)
    .eq("id", user.id)
    .maybeSingle();
  if (error && /logo_url/.test(error.message)) {
    ({ data } = await admin.from("profiles").select(FIELDS).eq("id", user.id).maybeSingle());
  }
  return data;
}

export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ eligible: false, profile: null });
  }
  const profile = await signedInProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const eligible = canListOnServices(profile.role as UserRole);
  return NextResponse.json({ eligible, profile: eligible ? profile : null });
}

export async function PATCH(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Sign in on the live account to save a profile." }, { status: 400 });
  }
  const profile = await signedInProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canListOnServices(profile.role as UserRole)) {
    return NextResponse.json({ error: "This account cannot be listed." }, { status: 403 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (body.confirmThai) {
    const { error } = await admin.from("profiles").update({ nationality: "Thai" }).eq("id", profile.id);
    if (error) return NextResponse.json({ error: "Could not save the profile." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (typeof body.visible !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const skills = body.skills == null ? null : normalizeTalentSkills(body.skills);
  const tags = body.tags == null ? null : normalizeWorkTags(body.tags);
  const bio = body.bio?.trim() || null;
  const location = normalizeLocationLabel(body.location);
  const country = normalizeCountryLabel(body.country);
  const nationality = body.nationality === undefined ? undefined : normalizeCountryLabel(body.nationality);
  if (body.visible && !location && !country) {
    return NextResponse.json({ error: "Add the town or island before showing your profile." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    job_search_visible: body.visible,
    ...(skills ? { job_search_skills: skills } : {}),
    ...(tags ? { job_search_tags: tags } : {}),
    job_search_bio: bio,
    job_search_location: location,
    job_search_country: country,
    ...(nationality !== undefined ? { nationality } : {}),
    job_search_updated_at: new Date().toISOString(),
  };
  if (body.logo === null) patch.logo_url = null;
  else if (typeof body.logo === "string" && body.logo.startsWith("data:image/")) {
    const logoUrl = await storeAccountLogo(admin, profile.id, body.logo);
    if (logoUrl) patch.logo_url = logoUrl;
  }
  let { data, error } = await admin.from("profiles").update(patch).eq("id", profile.id).select(`${FIELDS}, logo_url`).single();
  if (error && /logo_url/.test(error.message)) {
    delete patch.logo_url;
    ({ data, error } = await admin.from("profiles").update(patch).eq("id", profile.id).select(FIELDS).single());
  }
  if (error || !data) {
    return NextResponse.json({ error: "Could not save the profile." }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

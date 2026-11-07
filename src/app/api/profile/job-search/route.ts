import { NextResponse } from "next/server";
import { z } from "zod";
import { storeAccountLogo } from "@/lib/auth/logo";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/env";
import {
  canListInTalentSearch,
  normalizeCountryLabel,
  normalizeLocationLabel,
  normalizeTalentSkills,
  normalizeWorkTags,
} from "@/lib/talent";
import type { UserRole } from "@/lib/design-tokens";

const bodySchema = z.object({
  visible: z.boolean(),
  skills: z.array(z.string()).max(12).optional(),
  tags: z.array(z.string()).max(12).optional(),
  bio: z.string().max(500).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  clear_pin: z.boolean().optional(),
  logo: z.string().max(2_000_000).nullable().optional(),
});

export async function PATCH(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json(
      { error: "Demo mode is read-only for talent settings." },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!canListInTalentSearch(profile.role as UserRole)) {
    return NextResponse.json(
      { error: "Only field staff and managers can list on Pulseflow Services." },
      { status: 403 },
    );
  }

  const skills = body.skills === undefined ? undefined : normalizeTalentSkills(body.skills);
  const tags = body.tags === undefined ? undefined : normalizeWorkTags(body.tags);
  const bio = body.bio?.trim() || null;
  const location = normalizeLocationLabel(body.location);
  const country = normalizeCountryLabel(body.country);
  const clearPin = Boolean(body.clear_pin);
  const hasPin =
    !clearPin &&
    typeof body.lat === "number" &&
    typeof body.lng === "number" &&
    Number.isFinite(body.lat) &&
    Number.isFinite(body.lng);
  const lat = hasPin ? body.lat! : null;
  const lng = hasPin ? body.lng! : null;

  if (body.visible && !location && !country) {
    return NextResponse.json(
      { error: "Add a city or country so owners can find you by location." },
      { status: 400 },
    );
  }
  if (body.visible && skills !== undefined && skills.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one skill so owners can find you." },
      { status: 400 },
    );
  }

  const patch: Record<string, unknown> = {
    job_search_visible: body.visible,
    ...(skills !== undefined ? { job_search_skills: skills } : {}),
    ...(tags !== undefined ? { job_search_tags: tags } : {}),
    job_search_bio: bio,
    job_search_location: location,
    job_search_country: country,
    job_search_lat: lat,
    job_search_lng: lng,
    job_search_updated_at: new Date().toISOString(),
  };
  if (body.logo === null) patch.logo_url = null;
  else if (typeof body.logo === "string" && body.logo.startsWith("data:image/")) {
    const logoUrl = await storeAccountLogo(admin, user.id, body.logo);
    if (logoUrl) patch.logo_url = logoUrl;
  }
  let { data: updated, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select(
      "job_search_visible, job_search_skills, job_search_tags, job_search_bio, job_search_location, job_search_country, job_search_lat, job_search_lng, job_search_updated_at",
    )
    .single();

  if (error && /logo_url/.test(error.message)) {
    delete patch.logo_url;
    ({ data: updated, error } = await admin.from("profiles").update(patch).eq("id", user.id).select(
      "job_search_visible, job_search_skills, job_search_tags, job_search_bio, job_search_location, job_search_country, job_search_lat, job_search_lng, job_search_updated_at",
    ).single());
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: updated });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/env";
import {
  canListInTalentSearch,
  normalizeCountryLabel,
  normalizeLocationLabel,
  normalizeTalentSkills,
} from "@/lib/talent";
import type { UserRole } from "@/lib/design-tokens";

const bodySchema = z.object({
  visible: z.boolean(),
  skills: z.array(z.string()).max(12).optional(),
  bio: z.string().max(500).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  clear_pin: z.boolean().optional(),
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
      { error: "Only field staff and managers can join the talent directory." },
      { status: 403 },
    );
  }

  const skills = normalizeTalentSkills(body.skills ?? []);
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

  if (body.visible && skills.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one skill before going visible." },
      { status: 400 },
    );
  }
  if (body.visible && !location && !country) {
    return NextResponse.json(
      { error: "Add a city or country so owners can find you by location." },
      { status: 400 },
    );
  }

  const { data: updated, error } = await admin
    .from("profiles")
    .update({
      job_search_visible: body.visible,
      job_search_skills: skills,
      job_search_bio: bio,
      job_search_location: location,
      job_search_country: country,
      job_search_lat: lat,
      job_search_lng: lng,
      job_search_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select(
      "job_search_visible, job_search_skills, job_search_bio, job_search_location, job_search_country, job_search_lat, job_search_lng, job_search_updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: updated });
}

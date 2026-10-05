import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";

export const runtime = "nodejs";

const assignSchema = z.object({
  profile_id: z.string().uuid(),
});

/** Assign a cleaner or staff teammate to a property. Does not remove other assignees. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMcpAuth(request, "villas:write");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let body: z.infer<typeof assignSchema>;
  try {
    body = assignSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: villa } = await admin
    .from("villas")
    .select("id")
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .maybeSingle();
  if (!villa) {
    return NextResponse.json({ error: "Villa not in this org." }, { status: 404 });
  }

  const { data: person } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", body.profile_id)
    .eq("org_id", auth.orgId)
    .maybeSingle();
  if (!person) {
    return NextResponse.json(
      { error: "Person not in this org. Use pulse_list_team." },
      { status: 400 },
    );
  }
  if (person.role !== "cleaner" && person.role !== "staff") {
    return NextResponse.json(
      { error: "Only cleaners and staff can be assigned to a property." },
      { status: 400 },
    );
  }

  const { data: inserted, error: insertError } = await admin
    .from("villa_assignments")
    .insert({
      org_id: auth.orgId,
      villa_id: id,
      profile_id: person.id,
    })
    .select("id, villa_id, profile_id")
    .maybeSingle();

  let assignment = inserted;
  if (insertError) {
    if (insertError.code !== "23505") {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    const { data: existing, error: existingError } = await admin
      .from("villa_assignments")
      .select("id, villa_id, profile_id")
      .eq("org_id", auth.orgId)
      .eq("villa_id", id)
      .eq("profile_id", person.id)
      .maybeSingle();
    if (existingError || !existing) {
      return NextResponse.json(
        { error: existingError?.message ?? "Could not assign." },
        { status: 500 },
      );
    }
    assignment = existing;
  }

  const { data: rows, error: listError } = await admin
    .from("villa_assignments")
    .select("profile_id")
    .eq("org_id", auth.orgId)
    .eq("villa_id", id);
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const profileIds = (rows ?? []).map((row) => row.profile_id);
  const { data: people, error: peopleError } = profileIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, role")
        .in("id", profileIds)
    : { data: [], error: null };
  if (peopleError) {
    return NextResponse.json({ error: peopleError.message }, { status: 500 });
  }

  return NextResponse.json({
    assignment,
    already_assigned: Boolean(insertError),
    assignees: (people ?? []).map((p) => ({
      profile_id: p.id,
      full_name: p.full_name,
      role: p.role,
    })),
  });
}

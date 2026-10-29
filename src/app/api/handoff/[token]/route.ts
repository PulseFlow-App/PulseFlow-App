import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

/** Public preview of a pending property handoff. */
export async function GET(_request: Request, context: Ctx) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Handoff requires a live workspace." },
      { status: 400 },
    );
  }

  const { token } = await context.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: handoff } = await admin
    .from("property_handoffs")
    .select(
      "id, token, status, to_email, to_full_name, create_company, company_name, target_org_id, villa_ids, personal_org_id, from_profile_id, resulting_org_id, created_at",
    )
    .eq("token", token)
    .maybeSingle();

  if (!handoff) {
    return NextResponse.json({ error: "Handoff not found." }, { status: 404 });
  }

  const [{ data: inviter }, { data: villas }, { data: targetOrg }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name")
        .eq("id", handoff.from_profile_id)
        .maybeSingle(),
      admin
        .from("villas")
        .select("id, name, area, photo_url")
        .in("id", handoff.villa_ids as string[]),
      handoff.target_org_id
        ? admin
            .from("organizations")
            .select("id, name, kind")
            .eq("id", handoff.target_org_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return NextResponse.json({
    handoff: {
      id: handoff.id,
      token: handoff.token,
      status: handoff.status,
      toEmail: handoff.to_email,
      toFullName: handoff.to_full_name,
      createCompany: handoff.create_company,
      companyName: handoff.company_name,
      targetOrgId: handoff.target_org_id,
      resultingOrgId: handoff.resulting_org_id,
      createdAt: handoff.created_at,
    },
    inviter: inviter
      ? { id: inviter.id, fullName: inviter.full_name }
      : null,
    villas: (villas ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      area: v.area,
      photoUrl: v.photo_url,
    })),
    targetOrg: targetOrg
      ? { id: targetOrg.id, name: targetOrg.name, kind: targetOrg.kind }
      : null,
  });
}

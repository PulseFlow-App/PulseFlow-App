import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { canInviteStaff, invitableStaffRoles } from "@/lib/roles";
import { ensureStaffContact } from "@/lib/contacts/ensure-staff-contact";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import { appOriginFromRequest } from "@/lib/email/send";
import type { UserRole } from "@/lib/design-tokens";

export const runtime = "nodejs";

const bodySchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(["manager", "cleaner", "staff"]).default("staff"),
});

/**
 * Invite a talent-directory profile to the caller's company.
 * If they are already a member, ensure a bookable contact exists.
 * Otherwise create a staff invite + in-app notification with the join link.
 */
export async function POST(request: Request) {
  const rl = rateLimit(`talent-invite:${clientIp(request)}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Talent invites require a signed-in company account." },
      { status: 400 },
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
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { data: actor } = await supabase
    .from("profiles")
    .select("id, org_id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!actor?.org_id) {
    return NextResponse.json({ error: "Profile not found." }, { status: 400 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, kind, name")
    .eq("id", actor.org_id)
    .maybeSingle();
  if (!org || org.kind !== "company") {
    return NextResponse.json(
      { error: "Only company workspaces can invite staff." },
      { status: 403 },
    );
  }

  if (!canInviteStaff(actor.role as UserRole, org.kind)) {
    return NextResponse.json(
      { error: "Only owners or managers can invite staff." },
      { status: 403 },
    );
  }

  const allowed = invitableStaffRoles(actor.role as UserRole, org.kind);
  if (!allowed.includes(body.role)) {
    return NextResponse.json(
      { error: "You cannot invite that role." },
      { status: 403 },
    );
  }

  if (body.profileId === user.id) {
    return NextResponse.json(
      { error: "You cannot invite yourself." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: talent } = await admin
    .from("profiles")
    .select(
      "id, full_name, email, phone, job_title, role, job_search_visible, job_search_skills, org_id",
    )
    .eq("id", body.profileId)
    .maybeSingle();

  if (!talent) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }
  if (talent.role === "owner" || talent.role === "guest") {
    return NextResponse.json(
      { error: "That profile cannot be invited as staff." },
      { status: 400 },
    );
  }

  const { data: membership } = await admin
    .from("org_memberships")
    .select("id, role")
    .eq("org_id", org.id)
    .eq("profile_id", talent.id)
    .maybeSingle();
  const alreadyMember =
    Boolean(membership) || talent.org_id === org.id;

  if (alreadyMember) {
    const contact = await ensureStaffContact(admin, {
      orgId: org.id,
      profile: talent,
    });
    return NextResponse.json({
      ok: true,
      alreadyMember: true,
      contactId: contact.id,
      contactCreated: contact.created,
      inviteUrl: null,
    });
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const { data: invite, error: inviteErr } = await admin
    .from("invites")
    .insert({
      token,
      org_id: org.id,
      role: body.role,
      full_name: talent.full_name,
      email: talent.email ?? null,
      phone: talent.phone ?? null,
      job_title: talent.job_title ?? null,
      created_by: actor.id,
    })
    .select("id, token")
    .single();

  if (inviteErr || !invite) {
    return NextResponse.json(
      { error: inviteErr?.message ?? "Could not create invite." },
      { status: 500 },
    );
  }

  const origin = appOriginFromRequest(request);
  const inviteUrl = `${origin}/join/${invite.token}`;

  await admin.from("notifications").insert({
    org_id: talent.org_id,
    kind: "team_joined",
    title: "Company invite",
    body: `${actor.full_name} invited you to join ${org.name} on Pulse Flow.`,
    href: `/join/${invite.token}`,
    entity_id: invite.id,
    audience_profile_ids: [talent.id],
  });

  return NextResponse.json({
    ok: true,
    alreadyMember: false,
    contactId: null,
    contactCreated: false,
    inviteUrl,
    inviteId: invite.id,
  });
}

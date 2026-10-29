import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import { appOriginFromRequest, sendAppEmail } from "@/lib/email/send";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    villaIds: z.array(z.string().uuid()).min(1).max(50),
    toEmail: z.string().email(),
    toFullName: z.string().trim().max(120).optional(),
    createCompany: z.boolean(),
    companyName: z.string().trim().min(1).max(120).optional(),
    targetOrgId: z.string().uuid().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.createCompany && !val.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company name is required.",
        path: ["companyName"],
      });
    }
  });

/**
 * Create a property handoff invite: move personal villas to an owner's company.
 */
export async function POST(request: Request) {
  const rl = rateLimit(`handoff-create:${clientIp(request)}`, {
    limit: 15,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Handoff requires a live Supabase workspace." },
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
  } catch (e) {
    const msg =
      e instanceof z.ZodError
        ? e.issues[0]?.message ?? "Invalid payload."
        : "Invalid payload.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, org_id, personal_org_id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const personalOrgId = profile.personal_org_id as string | null;
  if (!personalOrgId) {
    return NextResponse.json(
      {
        error:
          "Create a personal property first, then invite an owner to take them over.",
      },
      { status: 400 },
    );
  }

  const toEmail = body.toEmail.trim().toLowerCase();
  if (toEmail === String(profile.email ?? "").toLowerCase()) {
    return NextResponse.json(
      { error: "Use a different email for the owner." },
      { status: 400 },
    );
  }

  const { data: villas, error: villaErr } = await admin
    .from("villas")
    .select("id, name, org_id")
    .eq("org_id", personalOrgId)
    .in("id", body.villaIds);
  if (villaErr) {
    return NextResponse.json({ error: villaErr.message }, { status: 500 });
  }
  if (!villas || villas.length !== body.villaIds.length) {
    return NextResponse.json(
      { error: "Select only villas from your personal list." },
      { status: 400 },
    );
  }

  if (body.targetOrgId) {
    const { data: target } = await admin
      .from("organizations")
      .select("id, kind")
      .eq("id", body.targetOrgId)
      .maybeSingle();
    if (!target || target.kind !== "company") {
      return NextResponse.json(
        { error: "Target must be a company workspace." },
        { status: 400 },
      );
    }
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const { data: handoff, error: insertErr } = await admin
    .from("property_handoffs")
    .insert({
      token,
      from_profile_id: profile.id,
      personal_org_id: personalOrgId,
      villa_ids: body.villaIds,
      to_email: toEmail,
      to_full_name: body.toFullName?.trim() || null,
      create_company: body.createCompany,
      company_name: body.createCompany
        ? body.companyName!.trim()
        : body.companyName?.trim() || null,
      target_org_id: body.createCompany ? null : body.targetOrgId ?? null,
      status: "pending",
    })
    .select("id, token")
    .single();

  if (insertErr || !handoff) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Could not create handoff." },
      { status: 500 },
    );
  }

  const origin = appOriginFromRequest(request);
  const handoffUrl = `${origin}/handoff/${handoff.token}`;
  const villaNames = (villas as { name: string }[])
    .map((v) => v.name)
    .join(", ");

  await sendAppEmail({
    to: toEmail,
    subject: `${profile.full_name} wants to hand properties to you on Pulse Flow`,
    text: [
      `Hi${body.toFullName ? ` ${body.toFullName}` : ""},`,
      "",
      `${profile.full_name} invited you to take ownership of: ${villaNames}.`,
      body.createCompany
        ? `They proposed a new company: ${body.companyName!.trim()}.`
        : "They want to move these into your existing company.",
      "",
      `Open this link to accept: ${handoffUrl}`,
      "",
      "Pulse Flow",
    ].join("\n"),
    html: `<p>Hi${body.toFullName ? ` ${body.toFullName}` : ""},</p>
<p><strong>${escapeHtml(profile.full_name)}</strong> invited you to take ownership of:
<strong>${escapeHtml(villaNames)}</strong>.</p>
<p>${
      body.createCompany
        ? `They proposed a new company: <strong>${escapeHtml(body.companyName!.trim())}</strong>.`
        : "They want to move these into your existing company."
    }</p>
<p><a href="${handoffUrl}">Accept handoff</a></p>`,
  });

  return NextResponse.json({
    ok: true,
    id: handoff.id,
    token: handoff.token,
    handoffUrl,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { AGREED_REPLY, quoteLabel } from "@/lib/pros/delivery";
import { storeChatPhoto } from "@/lib/pros/chat-photo";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const postSchema = z.object({
  requestId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(12).max(2000),
  whenLabel: z.string().trim().max(280).optional(),
  areaLabel: z.string().trim().min(1).max(120).optional(),
  shareLocation: z.string().trim().min(1).max(500).optional(),
  photos: z.array(z.string().max(8_000_000)).max(3).optional(),
  targets: z
    .array(
      z.object({
        profileId: z.string().uuid(),
        name: z.string().trim().min(1).max(80),
      }),
    )
    .min(1)
    .max(12),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["quote", "accept", "cancel", "edit"]),
  min: z.number().finite().nonnegative().optional(),
  max: z.number().finite().nonnegative().nullable().optional(),
  currency: z.string().trim().max(8).optional(),
  note: z.string().trim().max(500).optional(),
  reason: z.enum(["schedule", "price", "scope", "not_needed", "other"]).optional(),
  detail: z.string().trim().max(280).optional(),
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(12).max(2000).optional(),
  whenLabel: z.string().trim().max(280).optional(),
  areaLabel: z.string().trim().min(1).max(120).optional(),
  shareLocation: z.string().trim().min(1).max(500).optional(),
  visitTime: z
    .string()
    .trim()
    .regex(/^\d{1,2}:\d{2}$/)
    .optional(),
});

async function actor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ requests: [] });
  }
  const user = await actor();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const scope = `created_by.eq.${user.id},target_profile_id.eq.${user.id}`;
  // Prefer the richest select. If a newer column is missing, keep photos in the next attempt.
  const selects = [
    "id, request_id, created_by, target_profile_id, target_name, title, description, when_label, visit_time, area_label, share_location, reply_message, reply_amount, reply_currency, quote_max, quote_note, photos, accepted_at, cancelled_at, cancelled_by, cancel_reason, created_at, replied_at",
    "id, request_id, created_by, target_profile_id, target_name, title, description, when_label, area_label, share_location, reply_message, reply_amount, reply_currency, quote_max, quote_note, photos, accepted_at, cancelled_at, cancelled_by, cancel_reason, created_at, replied_at",
    "id, request_id, created_by, target_profile_id, target_name, title, description, when_label, reply_message, reply_amount, reply_currency, quote_max, quote_note, photos, accepted_at, created_at, replied_at",
    "id, request_id, created_by, target_profile_id, target_name, title, description, when_label, reply_message, reply_amount, reply_currency, photos, created_at, replied_at",
    "id, request_id, created_by, target_profile_id, target_name, title, description, when_label, reply_message, reply_amount, reply_currency, created_at, replied_at",
  ];
  let data: Record<string, unknown>[] | null = null;
  for (const columns of selects) {
    const result = await admin
      .from("service_requests")
      .select(columns)
      .or(scope)
      .order("created_at", { ascending: false })
      .limit(40);
    if (!result.error) {
      data = (result.data as unknown as Record<string, unknown>[] | null) ?? [];
      break;
    }
  }
  if (!data) return NextResponse.json({ requests: [] });
  const rows = data.map((row) => {
    const staff = row.target_profile_id === user.id;
    const booked = String(row.reply_message ?? "").trim() === AGREED_REPLY || Boolean(row.accepted_at);
    if (staff && !booked) {
      return { ...row, share_location: null };
    }
    return row;
  });
  return NextResponse.json({ requests: rows });
}

export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, sent: 0 });
  }
  const user = await actor();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`services-request:${user.id}:${clientIp(request)}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const admin = createAdminClient();
  const ids = [...new Set([user.id, ...body.targets.map((row) => row.profileId)])];
  const { data: people } = await admin
    .from("profiles")
    .select("id")
    .in("id", ids);
  const byId = new Map((people ?? []).map((row) => [row.id as string, row]));
  if (!byId.has(user.id)) {
    return NextResponse.json({ error: "Profile missing." }, { status: 400 });
  }

  const targets = body.targets.filter((row) => row.profileId !== user.id && byId.has(row.profileId));
  if (!targets.length) return NextResponse.json({ ok: true, sent: 0 });

  const rows = targets.map((row) => ({
    request_id: body.requestId,
    created_by: user.id,
    target_profile_id: row.profileId,
    target_name: row.name,
    title: body.title,
    description: body.description,
    when_label: body.whenLabel || null,
    area_label: body.areaLabel?.trim() || null,
    share_location: body.shareLocation?.trim() || null,
  }));
  let { error: insertError } = await admin
    .from("service_requests")
    .upsert(rows, { onConflict: "request_id,target_profile_id", ignoreDuplicates: true });
  if (insertError && /area_label|share_location/.test(insertError.message)) {
    ({ error: insertError } = await admin.from("service_requests").upsert(
      rows.map(({ area_label: _a, share_location: _s, ...row }) => row),
      { onConflict: "request_id,target_profile_id", ignoreDuplicates: true },
    ));
  }
  if (insertError) {
    return NextResponse.json({ error: "Could not save the request." }, { status: 500 });
  }

  const photoUrls: string[] = [];
  for (const photo of body.photos ?? []) {
    if (photo.startsWith("http")) photoUrls.push(photo);
    else if (photo.startsWith("data:image/")) {
      const url = await storeChatPhoto(admin, body.requestId, photo);
      if (url) photoUrls.push(url);
    }
  }
  if (photoUrls.length) {
    await admin.from("service_requests").update({ photos: photoUrls }).eq("request_id", body.requestId).eq("created_by", user.id);
  }

  try {
    const { sendWebPushMany } = await import("@/lib/push/web-push");
    await sendWebPushMany(
      targets.map((row) => ({
        title: body.title,
        body: body.description.slice(0, 140),
        href: "/inbox",
        tag: `services:${body.requestId}:${row.profileId}`,
        kind: "message" as const,
        org_id: user.id,
        audience_profile_ids: [row.profileId],
      })),
    );
  } catch {
    // The request is saved even when the phone alert cannot be sent.
  }

  return NextResponse.json({ ok: true, sent: targets.length });
}

async function notifyOther(
  row: { id: string; title: string; created_by: string; target_profile_id: string },
  actorId: string,
  body: string,
) {
  const audience = actorId === row.created_by ? row.target_profile_id : row.created_by;
  try {
    const { sendWebPush } = await import("@/lib/push/web-push");
    await sendWebPush({
      title: row.title,
      body,
      href: `/chat/${row.id}`,
      tag: `services-change:${row.id}`,
      kind: "message",
      org_id: actorId,
      audience_profile_ids: [audience],
    });
  } catch {
    // The change is saved even when the phone alert cannot be sent.
  }
}

export async function PATCH(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const user = await actor();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  type DeliveryRow = {
    id: string;
    target_profile_id: string;
    created_by: string;
    title: string;
    description?: string | null;
    when_label?: string | null;
    request_id: string;
    reply_message: string | null;
    reply_amount: number | null;
    reply_currency: string | null;
    quote_max?: number | null;
    cancelled_at?: string | null;
  };
  const admin = createAdminClient();
  const full = await admin
    .from("service_requests")
    .select("id, target_profile_id, created_by, title, description, when_label, request_id, reply_message, reply_amount, reply_currency, quote_max, cancelled_at")
    .eq("id", body.id)
    .maybeSingle();
  let row = full.data as DeliveryRow | null;
  if (full.error && /cancelled_at|quote_max|description|when_label/.test(full.error.message)) {
    const plain = await admin
      .from("service_requests")
      .select("id, target_profile_id, created_by, title, request_id, reply_message, reply_amount, reply_currency")
      .eq("id", body.id)
      .maybeSingle();
    row = (plain.data as DeliveryRow | null) ?? null;
  } else if (full.error) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const staff = row.target_profile_id === user.id;
  const customer = row.created_by === user.id;
  if (!staff && !customer) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (row.cancelled_at) {
    return NextResponse.json({ error: "This job is cancelled." }, { status: 400 });
  }

  if (body.action === "cancel") {
    if (!body.reason) return NextResponse.json({ error: "Pick a reason." }, { status: 400 });
    const reason = body.detail ? `${body.reason}\n${body.detail}` : body.reason;
    const { error } = await admin
      .from("service_requests")
      .update({
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancel_reason: reason,
      })
      .eq("id", body.id);
    if (error && /cancelled_at|cancelled_by|cancel_reason/.test(error.message)) {
      // Migration 077 not applied yet: drop the row so a new order can be created.
      const { error: delErr } = await admin.from("service_requests").delete().eq("id", body.id);
      if (delErr) return NextResponse.json({ error: "Could not save the reply." }, { status: 500 });
    } else if (error) {
      return NextResponse.json({ error: "Could not save the reply." }, { status: 500 });
    }
    await notifyOther(row, user.id, "Cancelled");
    return NextResponse.json({ ok: true });
  }

  if (body.action === "edit") {
    if (!customer) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (!body.title || !body.description || !body.whenLabel) {
      return NextResponse.json({ error: "Add the work and a date." }, { status: 400 });
    }
    if (!body.areaLabel || !body.shareLocation) {
      return NextResponse.json({ error: "Add an area and location." }, { status: 400 });
    }
    const patch: Record<string, string> = {
      title: body.title,
      description: body.description,
      when_label: body.whenLabel,
      area_label: body.areaLabel,
      share_location: body.shareLocation,
    };
    const attempts = [
      patch,
      {
        title: patch.title,
        description: patch.description,
        when_label: patch.when_label,
        area_label: patch.area_label,
      },
      {
        title: patch.title,
        description: patch.description,
        when_label: patch.when_label,
      },
    ];
    let error: { message: string } | null = null;
    for (const next of attempts) {
      let result = await admin.from("service_requests").update(next).eq("request_id", row.request_id).is("cancelled_at", null);
      if (result.error && /cancelled_at/.test(result.error.message)) {
        result = await admin.from("service_requests").update(next).eq("request_id", row.request_id);
      }
      error = result.error;
      if (!error) break;
      if (!/area_label|share_location/.test(error.message)) break;
    }
    if (error) return NextResponse.json({ error: "Could not save the reply." }, { status: 500 });
    await notifyOther(row, user.id, body.whenLabel);
    return NextResponse.json({ ok: true });
  }

  if (row.reply_message === AGREED_REPLY) return NextResponse.json({ ok: true });

  if (body.action === "quote") {
    if (!staff) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (body.min == null) return NextResponse.json({ error: "Add a price." }, { status: 400 });
    if (body.max != null && body.max < body.min) return NextResponse.json({ error: "Add a price." }, { status: 400 });
    if (!body.visitTime) return NextResponse.json({ error: "Pick a visit time." }, { status: 400 });
    const visitTime = body.visitTime.includes(":")
      ? `${String(Number(body.visitTime.split(":")[0])).padStart(2, "0")}:${body.visitTime.split(":")[1].slice(0, 2)}`
      : body.visitTime;
    const base = {
      reply_amount: body.min,
      reply_currency: body.currency?.trim() || "THB",
      replied_at: new Date().toISOString(),
    };
    // Keep quote_max and visit_time whenever the columns exist.
    const quotePatches: Record<string, unknown>[] = [
      {
        ...base,
        quote_max: body.max ?? null,
        quote_note: body.note?.trim() || null,
        visit_time: visitTime,
        chat_open: true,
      },
      {
        ...base,
        quote_max: body.max ?? null,
        quote_note: body.note?.trim() || null,
        visit_time: visitTime,
      },
      {
        ...base,
        quote_max: body.max ?? null,
        visit_time: visitTime,
        chat_open: true,
      },
      { ...base, quote_max: body.max ?? null, visit_time: visitTime },
      {
        ...base,
        quote_max: body.max ?? null,
        quote_note: body.note?.trim() || null,
        chat_open: true,
      },
      {
        ...base,
        quote_max: body.max ?? null,
        quote_note: body.note?.trim() || null,
      },
      { ...base, quote_max: body.max ?? null },
      { ...base, chat_open: true },
      base,
    ];
    let error: { message: string } | null = null;
    for (const patch of quotePatches) {
      const result = await admin.from("service_requests").update(patch).eq("id", body.id);
      error = result.error;
      if (!error) break;
    }
    if (error) return NextResponse.json({ error: "Could not save the quote." }, { status: 500 });
    try {
      const { sendWebPush } = await import("@/lib/push/web-push");
      const price = quoteLabel({
        reply_amount: body.min,
        quote_max: body.max,
        reply_currency: body.currency,
      });
      await sendWebPush({
        title: row.title as string,
        body: [price, visitTime].filter(Boolean).join(" · ") || "Quote",
        href: `/chat/${row.id}`,
        tag: `services-quote:${row.id}`,
        kind: "message",
        org_id: user.id,
        audience_profile_ids: [row.created_by as string],
      });
    } catch {
      // The quote is saved even when the phone alert cannot be sent.
    }
    return NextResponse.json({ ok: true });
  }

  if (!customer) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (row.reply_amount == null) return NextResponse.json({ error: "Wait for a quote." }, { status: 400 });
  const accepted = {
    reply_message: AGREED_REPLY,
    accepted_at: new Date().toISOString(),
    chat_open: true,
  };
  let { error } = await admin.from("service_requests").update(accepted).eq("id", body.id);
  if (error && /accepted_at|chat_open/.test(error.message)) {
    ({ error } = await admin.from("service_requests").update({ reply_message: AGREED_REPLY }).eq("id", body.id));
  }
  if (error) return NextResponse.json({ error: "Could not save the reply." }, { status: 500 });

  // First accepted quote wins: drop the other open asks for the same job.
  const siblingCancel = {
    cancelled_at: new Date().toISOString(),
    cancelled_by: user.id,
    cancel_reason: "other\nAnother professional was booked for this job.",
  };
  let sibling = await admin
    .from("service_requests")
    .update(siblingCancel)
    .eq("request_id", row.request_id)
    .neq("id", body.id)
    .is("cancelled_at", null);
  if (sibling.error && /cancelled_at|cancelled_by|cancel_reason/.test(sibling.error.message)) {
    sibling = await admin
      .from("service_requests")
      .delete()
      .eq("request_id", row.request_id)
      .neq("id", body.id);
  }

  try {
    const { sendWebPush } = await import("@/lib/push/web-push");
    await sendWebPush({
      title: row.title as string,
      body: ["Appointment · location shared", quoteLabel(row)].filter(Boolean).join(" · "),
      href: "/inbox",
      tag: `services-accept:${row.id}`,
      kind: "appointment",
      org_id: user.id,
      audience_profile_ids: [row.target_profile_id as string],
    });
  } catch {
    // The appointment is saved even when the phone alert cannot be sent.
  }

  return NextResponse.json({ ok: true });
}

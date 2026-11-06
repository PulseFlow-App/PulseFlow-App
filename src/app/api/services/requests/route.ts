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
  whenLabel: z.string().trim().max(160).optional(),
  photos: z.array(z.string().max(2_000_000)).max(3).optional(),
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
  action: z.enum(["quote", "accept"]),
  min: z.number().finite().nonnegative().optional(),
  max: z.number().finite().nonnegative().nullable().optional(),
  currency: z.string().trim().max(8).optional(),
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
  const full =
    "id, request_id, created_by, target_profile_id, target_name, title, description, when_label, reply_message, reply_amount, reply_currency, quote_max, photos, accepted_at, created_at, replied_at";
  const { data, error } = await admin
    .from("service_requests")
    .select(full)
    .or(`created_by.eq.${user.id},target_profile_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error && /quote_max|photos|accepted_at/.test(error.message)) {
    const fallback = await admin
      .from("service_requests")
      .select(
        "id, request_id, created_by, target_profile_id, target_name, title, description, when_label, reply_message, reply_amount, reply_currency, created_at, replied_at",
      )
      .or(`created_by.eq.${user.id},target_profile_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(40);
    if (fallback.error) return NextResponse.json({ requests: [] });
    return NextResponse.json({ requests: fallback.data ?? [] });
  }
  if (error) return NextResponse.json({ requests: [] });
  return NextResponse.json({ requests: data ?? [] });
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
  }));
  const { error: insertError } = await admin
    .from("service_requests")
    .upsert(rows, { onConflict: "request_id,target_profile_id", ignoreDuplicates: true });
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

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("service_requests")
    .select("id, target_profile_id, created_by, title, request_id, reply_message, reply_amount, reply_currency")
    .eq("id", body.id)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const staff = row.target_profile_id === user.id;
  const customer = row.created_by === user.id;
  if (!staff && !customer) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (row.reply_message === AGREED_REPLY) return NextResponse.json({ ok: true });

  if (body.action === "quote") {
    if (!staff) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (body.min == null) return NextResponse.json({ error: "Add a price." }, { status: 400 });
    if (body.max != null && body.max < body.min) return NextResponse.json({ error: "Add a price." }, { status: 400 });
    const patch = {
      reply_amount: body.min,
      reply_currency: body.currency?.trim() || "THB",
      replied_at: new Date().toISOString(),
      quote_max: body.max ?? null,
      chat_open: true,
    };
    let { error } = await admin.from("service_requests").update(patch).eq("id", body.id);
    if (error && /quote_max|chat_open/.test(error.message)) {
      ({ error } = await admin
        .from("service_requests")
        .update({
          reply_amount: patch.reply_amount,
          reply_currency: patch.reply_currency,
          replied_at: patch.replied_at,
        })
        .eq("id", body.id));
    }
    if (error) return NextResponse.json({ error: "Could not save the quote." }, { status: 500 });
    try {
      const { sendWebPush } = await import("@/lib/push/web-push");
      await sendWebPush({
        title: row.title as string,
        body: quoteLabel(row) ?? "Quote",
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
  try {
    const { sendWebPush } = await import("@/lib/push/web-push");
    await sendWebPush({
      title: row.title as string,
      body: ["Appointment · นัดหมาย", quoteLabel(row)].filter(Boolean).join(" · "),
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

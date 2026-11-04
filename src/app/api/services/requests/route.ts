import { NextResponse } from "next/server";
import { z } from "zod";
import { AGREED_REPLY } from "@/lib/pros/delivery";
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

const patchSchema = z
  .object({
    id: z.string().uuid(),
    agree: z.literal(true).optional(),
    message: z.string().trim().min(1).max(1000).optional(),
    amount: z.number().finite().nonnegative().nullable().optional(),
    currency: z.string().trim().max(8).optional(),
  })
  .refine((body) => body.agree === true || Boolean(body.message));

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
  const { data, error } = await admin
    .from("service_requests")
    .select(
      "id, request_id, created_by, target_profile_id, target_name, title, description, when_label, reply_message, reply_amount, reply_currency, created_at, replied_at",
    )
    .or(`created_by.eq.${user.id},target_profile_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(40);
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
    .select("id, target_profile_id, created_by, title, request_id, reply_message")
    .eq("id", body.id)
    .maybeSingle();
  if (!row || row.target_profile_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (row.reply_message) return NextResponse.json({ ok: true });

  const { error } = await admin
    .from("service_requests")
    .update({
      reply_message: body.agree ? AGREED_REPLY : body.message,
      reply_amount: body.amount ?? null,
      reply_currency: body.currency?.trim() || null,
      replied_at: new Date().toISOString(),
    })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: "Could not save the reply." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

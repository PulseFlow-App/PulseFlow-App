import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { AGREED_REPLY } from "@/lib/pros/delivery";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const postSchema = z.object({
  requestId: z.string().uuid(),
  targetProfileId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(4000),
  answers: z.record(z.string(), z.string()).optional(),
  locale: z.string().max(12).optional(),
});

export async function GET(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ reviews: [] });
  }
  const url = new URL(request.url);
  const profileId = url.searchParams.get("profileId");
  const admin = createAdminClient();
  let query = admin
    .from("service_reviews")
    .select("id, request_id, target_profile_id, author_id, stars, comment, answers, original_locale, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (profileId) query = query.eq("target_profile_id", profileId);
  const { data, error } = await query;
  if (error) {
    if (/service_reviews/.test(error.message)) return NextResponse.json({ reviews: [] });
    return NextResponse.json({ error: "Could not load reviews." }, { status: 500 });
  }
  return NextResponse.json({
    reviews: (data ?? []).map((row) => ({
      id: row.id as string,
      requestId: row.request_id as string,
      profileId: row.target_profile_id as string,
      authorId: row.author_id as string,
      stars: row.stars as number,
      comment: (row.comment as string) ?? "",
      answers: (row.answers as Record<string, string> | null) ?? null,
      originalLocale: (row.original_locale as string) ?? "en",
      createdAt: row.created_at as string,
    })),
  });
}

export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Sign in on the live account to save a review." }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: deliveries, error: deliveryError } = await admin
    .from("service_requests")
    .select("id, created_by, target_profile_id, title, reply_message, accepted_at, cancelled_at")
    .eq("request_id", body.requestId)
    .eq("created_by", user.id);
  if (deliveryError) {
    return NextResponse.json({ error: "Could not check the order." }, { status: 500 });
  }
  const booked = (deliveries ?? []).find(
    (row) =>
      row.target_profile_id === body.targetProfileId &&
      !row.cancelled_at &&
      (Boolean(row.accepted_at) || String(row.reply_message ?? "").trim() === AGREED_REPLY),
  );
  if (!booked) {
    return NextResponse.json({ error: "Only a booked job can be reviewed." }, { status: 400 });
  }

  const row = {
    request_id: body.requestId,
    target_profile_id: body.targetProfileId,
    author_id: user.id,
    stars: body.stars,
    comment: body.comment.trim(),
    answers: body.answers ?? {},
    original_locale: body.locale ?? "en",
  };
  const { data: saved, error } = await admin
    .from("service_reviews")
    .upsert(row, { onConflict: "request_id", ignoreDuplicates: true })
    .select("id, stars, created_at")
    .maybeSingle();
  if (error) {
    if (/service_reviews/.test(error.message)) {
      return NextResponse.json({ error: "Apply the service reviews migration first." }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not save the review." }, { status: 500 });
  }

  try {
    const { sendWebPush } = await import("@/lib/push/web-push");
    const stars = body.stars;
    await sendWebPush({
      title: (booked.title as string) || "Pulseflow Services",
      body: `New review · ${stars}/5`,
      href: `/p/${body.targetProfileId}`,
      tag: `services-review:${body.requestId}`,
      kind: "endorsement",
      org_id: user.id,
      audience_profile_ids: [body.targetProfileId],
    });
  } catch {
    // Review is saved even when the phone alert cannot be sent.
  }

  return NextResponse.json({
    ok: true,
    id: saved?.id ?? null,
    stars: body.stars,
  });
}

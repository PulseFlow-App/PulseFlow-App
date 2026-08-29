import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { sendWebPushMany, type PushPayload } from "@/lib/push/web-push";
import type { NotificationKind } from "@/lib/types";

export const runtime = "nodejs";

const itemSchema = z.object({
  org_id: z.string().uuid(),
  kind: z.string(),
  title: z.string().min(1),
  body: z.string(),
  href: z.string().nullable().optional(),
  entity_id: z.string().nullable().optional(),
  audience_profile_ids: z.array(z.string().uuid()).nullable().optional(),
  dedupe_key: z.string().nullable().optional(),
});

const bodySchema = z.object({
  notifications: z.array(itemSchema).min(1).max(40),
});

export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, sent: 0 });
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

  const payloads: PushPayload[] = body.notifications.map((n) => ({
    org_id: n.org_id,
    kind: n.kind as NotificationKind,
    title: n.title,
    body: n.body,
    href: n.href ?? "/notifications",
    audience_profile_ids: n.audience_profile_ids ?? null,
    tag: n.dedupe_key || (n.entity_id ? `${n.kind}:${n.entity_id}` : n.kind),
  }));

  const results = await sendWebPushMany(payloads);
  const sent = results.reduce((sum, r) => sum + (r.sent ?? 0), 0);
  return NextResponse.json({ ok: true, sent });
}

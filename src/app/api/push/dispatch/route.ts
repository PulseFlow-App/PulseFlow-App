import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { sendWebPushMany, type PushPayload } from "@/lib/push/web-push";
import type { NotificationKind } from "@/lib/types";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/** Short TTL so concurrent clients that race schedule-sync do not re-blast the same lock-screen alert. */
const recentPushKeys = new Map<string, number>();
const PUSH_DEDUPE_MS = 90_000;

function pushDedupeKey(n: {
  org_id: string;
  kind: string;
  title: string;
  body: string;
  entity_id?: string | null;
  dedupe_key?: string | null;
  audience_profile_ids?: string[] | null;
}) {
  const audience = (n.audience_profile_ids ?? []).slice().sort().join(",");
  return (
    n.dedupe_key ||
    `${n.org_id}:${n.kind}:${n.entity_id ?? ""}:${n.title}:${n.body}:${audience}`
  );
}

function takePushSlot(key: string) {
  const now = Date.now();
  for (const [k, at] of recentPushKeys) {
    if (now - at > PUSH_DEDUPE_MS) recentPushKeys.delete(k);
  }
  const prev = recentPushKeys.get(key);
  if (prev && now - prev < PUSH_DEDUPE_MS) return false;
  recentPushKeys.set(key, now);
  return true;
}

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

  const rl = rateLimit(`push:${user.id}:${clientIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const orgIds = [...new Set(body.notifications.map((n) => n.org_id))];
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("org_id, personal_org_id, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("org_memberships")
      .select("org_id, role")
      .eq("profile_id", user.id),
  ]);

  const roleByOrg = new Map<string, string>();
  if (profile?.org_id) {
    roleByOrg.set(profile.org_id, String(profile.role ?? ""));
  }
  for (const m of memberships ?? []) {
    roleByOrg.set(String(m.org_id), String(m.role ?? ""));
  }
  if (profile?.personal_org_id) {
    roleByOrg.set(profile.personal_org_id, String(profile.role ?? "owner"));
  }

  const canPushOrg = (orgId: string) => {
    const role = roleByOrg.get(orgId);
    return Boolean(role) && role !== "guest";
  };

  if (orgIds.some((id) => !canPushOrg(id))) {
    return NextResponse.json(
      { error: "Guests cannot dispatch push notifications." },
      { status: 403 },
    );
  }

  const payloads: PushPayload[] = [];
  let skipped = 0;
  for (const n of body.notifications) {
    // Bound free-form fields (clients previously could blast arbitrary text).
    if (n.title.length > 120 || n.body.length > 280) {
      skipped += 1;
      continue;
    }
    const key = pushDedupeKey(n);
    let claimed = true;
    const { data: dbClaim, error: dedupeErr } = await supabase.rpc(
      "try_claim_push_dedupe",
      { p_key: key, p_ttl_seconds: 90 },
    );
    if (!dedupeErr) {
      claimed = dbClaim !== false;
    } else {
      claimed = takePushSlot(key);
    }
    if (!claimed) {
      skipped += 1;
      continue;
    }
    payloads.push({
      org_id: n.org_id,
      kind: n.kind as NotificationKind,
      title: n.title,
      body: n.body,
      href: n.href ?? "/notifications",
      audience_profile_ids: n.audience_profile_ids ?? null,
      tag: n.dedupe_key || (n.entity_id ? `${n.kind}:${n.entity_id}` : n.kind),
    });
  }

  if (!payloads.length) {
    return NextResponse.json({ ok: true, sent: 0, skipped });
  }

  const results = await sendWebPushMany(payloads);
  const sent = results.reduce((sum, r) => sum + (r.sent ?? 0), 0);
  return NextResponse.json({ ok: true, sent, skipped });
}

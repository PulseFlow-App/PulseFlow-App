import { NextResponse } from "next/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildScheduleAlerts,
  insertNotifications,
} from "@/lib/notifications";
import type {
  Bill,
  Profile,
  ServiceOrder,
  Villa,
  VillaAssignment,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ORG_BATCH = 40;
/** Cap batches per invocation so a runaway loop cannot blow Vercel time. */
const MAX_BATCHES = 25;

/**
 * Daily schedule alerts (check-in/out, appointments, bills due) for remote owners.
 * Protect with CRON_SECRET. Configure on Vercel:
 *   Path: /api/cron/schedule-alerts
 *   Schedule: 0 1 * * * (01:00 UTC)
 *
 * By default walks company orgs in batches until done (or MAX_BATCHES).
 * Pass `?once=1` to process a single batch; use `?offset=` to resume.
 */
export async function GET(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, inserted: 0, done: true });
  }

  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const url = new URL(request.url);
  const startOffset = Math.max(0, Number(url.searchParams.get("offset") || 0));
  let offset = startOffset;
  const once = url.searchParams.get("once") === "1";

  let candidates = 0;
  let pushed = 0;
  let batches = 0;
  let lastBatchSize = 0;
  let done = false;

  while (batches < MAX_BATCHES) {
    const { data: orgPage, error: orgErr } = await admin
      .from("organizations")
      .select("id")
      .eq("kind", "company")
      .order("created_at", { ascending: true })
      .range(offset, offset + ORG_BATCH - 1);

    if (orgErr) {
      return NextResponse.json({ error: orgErr.message }, { status: 500 });
    }

    const orgIds = (orgPage ?? []).map((o) => o.id as string);
    if (!orgIds.length) {
      done = true;
      break;
    }

    lastBatchSize = orgIds.length;
    batches += 1;

    const [
      { data: villas },
      { data: bills },
      { data: orders },
      { data: profiles },
      { data: assignments },
    ] = await Promise.all([
      admin
        .from("villas")
        .select("id, org_id, name, check_in, check_out, status")
        .in("org_id", orgIds),
      admin
        .from("bills")
        .select(
          "id, org_id, description, amount, currency, status, due_date, villa_id, submitted_by",
        )
        .in("org_id", orgIds)
        .eq("status", "pending"),
      admin
        .from("service_orders")
        .select("*")
        .in("org_id", orgIds)
        .in("status", ["pending_ack", "agreed"]),
      admin
        .from("profiles")
        .select("id, org_id, role, full_name")
        .in("org_id", orgIds),
      admin
        .from("villa_assignments")
        .select("villa_id, profile_id, org_id")
        .in("org_id", orgIds),
    ]);

    const alerts = buildScheduleAlerts({
      now: new Date(),
      villas: (villas ?? []) as Villa[],
      bills: (bills ?? []) as Bill[],
      orders: (orders ?? []) as ServiceOrder[],
      profiles: (profiles ?? []) as Profile[],
      assignments: (assignments ?? []) as VillaAssignment[],
      existing: [],
    });

    const rows = alerts.map((n) => ({
      org_id: n.org_id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      href: n.href,
      entity_id: n.entity_id,
      audience_profile_ids: n.audience_profile_ids,
      dedupe_key: n.dedupe_key,
    }));

    candidates += rows.length;

    if (rows.length) {
      await insertNotifications(admin, rows);
      const { sendWebPushMany } = await import("@/lib/push/web-push");
      const results = await sendWebPushMany(
        rows.map((n) => ({
          org_id: n.org_id,
          kind: n.kind,
          title: n.title,
          body: n.body,
          href: n.href,
          audience_profile_ids: n.audience_profile_ids,
          tag: n.dedupe_key,
        })),
      );
      pushed += results.reduce((sum, r) => sum + (r.sent ?? 0), 0);
    }

    if (orgIds.length < ORG_BATCH) {
      done = true;
      break;
    }

    offset += ORG_BATCH;
    if (once) {
      done = false;
      break;
    }
  }

  const nextOffset = done ? null : offset;

  return NextResponse.json({
    ok: true,
    candidates,
    inserted: candidates,
    pushed,
    batches,
    lastBatchSize,
    startOffset,
    nextOffset,
    done,
  });
}

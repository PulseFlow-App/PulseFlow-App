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

/**
 * Daily schedule alerts (check-in/out, appointments, bills due) for remote owners.
 * Protect with CRON_SECRET. Configure on Vercel:
 *   Path: /api/cron/schedule-alerts
 *   Schedule: 0 1 * * * (01:00 UTC)
 */
export async function GET(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [
    { data: villas },
    { data: bills },
    { data: orders },
    { data: profiles },
    { data: assignments },
  ] = await Promise.all([
    admin.from("villas").select("id, org_id, name, check_in, check_out, status"),
    admin
      .from("bills")
      .select(
        "id, org_id, description, amount, currency, status, due_date, villa_id, submitted_by",
      )
      .eq("status", "pending"),
    admin
      .from("service_orders")
      .select("*")
      .in("status", ["pending_ack", "agreed"]),
    admin.from("profiles").select("id, org_id, role, full_name"),
    admin.from("villa_assignments").select("villa_id, profile_id, org_id"),
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

  if (!alerts.length) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  // Server-side insert + push (insertNotifications only pushes in the browser).
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

  await insertNotifications(admin, rows);

  // Push without a browser session (insertNotifications only dispatches in the client).
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
  const pushed = results.reduce((sum, r) => sum + (r.sent ?? 0), 0);

  return NextResponse.json({
    ok: true,
    candidates: rows.length,
    pushed,
  });
}

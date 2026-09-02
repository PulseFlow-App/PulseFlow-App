import webpush from "web-push";
import type { NotificationKind } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = {
  title: string;
  body: string;
  href?: string | null;
  tag?: string | null;
  kind?: NotificationKind;
  org_id: string;
  audience_profile_ids?: string[] | null;
};

/** Kinds that should wake a locked phone. */
export const PUSH_KINDS = new Set<NotificationKind>([
  "appointment",
  "message",
  "urgent_task",
  "task_assigned",
  "task_completed",
  "bill_submitted",
  "bill_paid",
  "team_joined",
  "check_in",
  "check_out",
  "guest_update",
]);

function vapidConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY,
  );
}

function ensureVapid() {
  if (!vapidConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:ops@pulseflow.site",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

type SubRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function resolveAudienceIds(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  audience: string[] | null | undefined,
) {
  if (audience && audience.length) return audience;
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("org_id", orgId);
  return (data ?? []).map((p) => p.id as string);
}

/** Send lock-screen pushes for one notification-shaped payload. */
export async function sendWebPush(payload: PushPayload) {
  if (!ensureVapid()) return { sent: 0, skipped: "vapid_missing" as const };
  if (payload.kind && !PUSH_KINDS.has(payload.kind)) {
    return { sent: 0, skipped: "kind_filtered" as const };
  }

  const admin = createAdminClient();
  const profileIds = await resolveAudienceIds(
    admin,
    payload.org_id,
    payload.audience_profile_ids,
  );
  if (!profileIds.length) return { sent: 0, skipped: "no_audience" as const };

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("profile_id", profileIds);

  const rows = (subs ?? []) as SubRow[];
  if (!rows.length) return { sent: 0, skipped: "no_subscriptions" as const };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.href || "/notifications",
    tag:
      payload.tag ||
      (payload.kind ? `pulseflow:${payload.kind}` : "pulseflow"),
  });

  let sent = 0;
  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        body,
      );
      sent += 1;
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "statusCode" in err
          ? Number((err as { statusCode?: number }).statusCode)
          : 0;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", row.id);
      } else {
        console.warn("webpush send failed", status || err);
      }
    }
  }

  return { sent };
}

export async function sendWebPushMany(payloads: PushPayload[]) {
  const results = [];
  for (const payload of payloads) {
    results.push(await sendWebPush(payload));
  }
  return results;
}

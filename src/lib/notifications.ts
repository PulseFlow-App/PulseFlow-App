import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import type {
  AppNotification,
  Bill,
  NotificationKind,
  Profile,
  ServiceOrder,
  Villa,
} from "@/lib/types";
import { formatMoney, formatShortDate } from "@/lib/utils";

export function notificationVisibleTo(
  n: AppNotification,
  profileId: string,
): boolean {
  if (!n.audience_profile_ids) return true;
  return n.audience_profile_ids.includes(profileId);
}

export function unreadNotifications(
  notifications: AppNotification[],
  profileId: string,
  orgId: string,
) {
  return notifications.filter(
    (n) =>
      n.org_id === orgId &&
      notificationVisibleTo(n, profileId) &&
      !n.read_by.includes(profileId),
  );
}

export function makeNotification(input: {
  org_id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
  entity_id?: string | null;
  audience_profile_ids?: string[] | null;
  dedupe_key?: string | null;
  created_at?: string;
}): AppNotification {
  return {
    id: crypto.randomUUID(),
    org_id: input.org_id,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    entity_id: input.entity_id ?? null,
    audience_profile_ids: input.audience_profile_ids ?? null,
    dedupe_key: input.dedupe_key ?? null,
    created_at: input.created_at ?? new Date().toISOString(),
    read_by: [],
  };
}

export function orgMemberIds(profiles: Profile[], orgId: string) {
  return profiles.filter((p) => p.org_id === orgId).map((p) => p.id);
}

export function ownerManagerIds(profiles: Profile[], orgId: string) {
  return profiles
    .filter(
      (p) =>
        p.org_id === orgId && (p.role === "owner" || p.role === "manager"),
    )
    .map((p) => p.id);
}

function dayLabel(date: string, today: Date) {
  const d = startOfDay(parseISO(date));
  const diff = differenceInCalendarDays(d, startOfDay(today));
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return format(d, "d MMM");
}

/**
 * Calendar-style alerts for upcoming check-ins/outs and bill due dates.
 * Deduped by dedupe_key so they only fire once per day/window.
 */
export function buildScheduleAlerts(input: {
  villas: Villa[];
  bills: Bill[];
  orders?: ServiceOrder[];
  existing: AppNotification[];
  now?: Date;
}): AppNotification[] {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const existingKeys = new Set(
    input.existing.map((n) => n.dedupe_key).filter(Boolean) as string[],
  );
  const next: AppNotification[] = [];

  const push = (n: AppNotification) => {
    if (n.dedupe_key && existingKeys.has(n.dedupe_key)) return;
    if (n.dedupe_key) existingKeys.add(n.dedupe_key);
    next.push(n);
  };

  for (const order of input.orders ?? []) {
    if (order.status === "cancelled" || order.status === "done") continue;
    const diff = differenceInCalendarDays(
      startOfDay(parseISO(order.scheduled_date)),
      today,
    );
    if (diff < 0 || diff > 1) continue;
    const when = dayLabel(order.scheduled_date, today);
    const window =
      formatWorkWindow(
        order.scheduled_date,
        order.time_start,
        order.time_end,
      ) ?? order.scheduled_date;
    const audience = order.staff_profile_id
      ? [order.staff_profile_id, order.ordered_by]
      : [order.ordered_by];
    push(
      makeNotification({
        org_id: order.org_id,
        kind: "appointment",
        title: `Appointment ${when}`,
        body: `${order.service_type} · ${order.location_label ?? "Villa"} · ${window}`,
        href: "/jobs",
        entity_id: order.id,
        audience_profile_ids: audience,
        dedupe_key: `appointment:${order.id}:${order.scheduled_date}:D${diff}`,
      }),
    );
  }

  for (const villa of input.villas) {
    for (const field of ["check_in", "check_out"] as const) {
      const date = villa[field];
      if (!date) continue;
      const diff = differenceInCalendarDays(startOfDay(parseISO(date)), today);
      if (diff < 0 || diff > 1) continue;
      const kind = field === "check_in" ? "check_in" : "check_out";
      const label = field === "check_in" ? "Check-in" : "Check-out";
      const when = dayLabel(date, today);
      const dedupe_key = `${kind}:${villa.id}:${date}:D${diff}`;
      push(
        makeNotification({
          org_id: villa.org_id,
          kind,
          title: `${label} ${when}`,
          body: `${villa.name} · ${formatShortDate(date)}`,
          href: `/villas/${villa.id}`,
          entity_id: villa.id,
          dedupe_key,
        }),
      );
    }
  }

  for (const bill of input.bills) {
    if (bill.status !== "pending" || !bill.due_date) continue;
    const diff = differenceInCalendarDays(
      startOfDay(parseISO(bill.due_date)),
      today,
    );
    if (diff > 2) continue;
    const when =
      diff < 0
        ? `overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"}`
        : diff === 0
          ? "due today"
          : `due ${dayLabel(bill.due_date, today)}`;
    const dedupe_key = `bill_due:${bill.id}:${bill.due_date}:D${Math.min(diff, 2)}`;
    push(
      makeNotification({
        org_id: bill.org_id,
        kind: "bill_due",
        title: `Bill ${when}`,
        body: `${bill.description} · ${formatMoney(Number(bill.amount), bill.currency)}`,
        href: "/bills",
        entity_id: bill.id,
        dedupe_key,
      }),
    );
  }

  return next;
}

export const NOTIFICATION_META: Record<
  NotificationKind,
  { label: string; tone: string }
> = {
  check_in: { label: "Check-in", tone: "text-secondary" },
  check_out: { label: "Check-out", tone: "text-primary" },
  urgent_task: { label: "Urgent", tone: "text-danger" },
  task_assigned: { label: "Task", tone: "text-muted" },
  message: { label: "Chat", tone: "text-primary" },
  bill_due: { label: "Bill due", tone: "text-warning-dark" },
  bill_submitted: { label: "Bill", tone: "text-muted" },
  appointment: { label: "Appointment", tone: "text-secondary" },
};

export function formatWorkWindow(
  date: string | null,
  timeStart: string | null,
  timeEnd: string | null,
) {
  if (!date && !timeStart) return null;
  const day = date ? formatShortDate(date) : "";
  if (timeStart && timeEnd) {
    return `${day}${day ? " · " : ""}${timeStart}-${timeEnd}`;
  }
  if (timeStart) return `${day}${day ? " · " : ""}from ${timeStart}`;
  return day || null;
}

export type ContactReachability = "confirmed" | "awaiting_ack" | "not_on_app";

export function contactReachability(
  contact: { linked_profile_id: string | null },
  orders: { contact_id: string | null; status: string }[],
  contactId: string,
): ContactReachability {
  if (!contact.linked_profile_id) return "not_on_app";
  const pending = orders.some(
    (o) => o.contact_id === contactId && o.status === "pending_ack",
  );
  if (pending) return "awaiting_ack";
  return "confirmed";
}

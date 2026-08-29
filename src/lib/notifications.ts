import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import type {
  AppNotification,
  Bill,
  Endorsement,
  NotificationKind,
  Profile,
  ServiceOrder,
  Villa,
  VillaAssignment,
} from "@/lib/types";
import { formatMoney, formatShortDate } from "@/lib/utils";
import { capitalizeLabel } from "@/lib/format-label";
import { weekKey } from "@/lib/endorsements";

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
      !(n.read_by ?? []).includes(profileId),
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

/** Owners + managers + anyone assigned to this villa. */
export function villaOpsAudience(
  orgId: string,
  villaId: string,
  profiles: Profile[],
  assignments: Pick<VillaAssignment, "villa_id" | "profile_id">[],
) {
  const assigned = assignments
    .filter((a) => a.villa_id === villaId)
    .map((a) => a.profile_id);
  return [...new Set([...ownerManagerIds(profiles, orgId), ...assigned])];
}

/** Owners + managers + the person who submitted the bill. */
export function billDueAudience(bill: Pick<Bill, "org_id" | "submitted_by">, profiles: Profile[]) {
  return [...new Set([...ownerManagerIds(profiles, bill.org_id), bill.submitted_by])];
}

export type NotificationInsert = {
  org_id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
  entity_id?: string | null;
  audience_profile_ids?: string[] | null;
  dedupe_key?: string | null;
};

export function toInsertRow(n: AppNotification): NotificationInsert {
  return {
    org_id: n.org_id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    href: n.href,
    entity_id: n.entity_id,
    audience_profile_ids: n.audience_profile_ids,
    dedupe_key: n.dedupe_key,
  };
}

/** Inserts rows; ignores duplicate dedupe_key conflicts. */
export async function insertNotifications(
  supabase: {
    from: (table: string) => {
      insert: (
        row: NotificationInsert,
      ) => PromiseLike<{ error: { code?: string; message: string } | null }>;
    };
  },
  rows: NotificationInsert[],
) {
  for (const row of rows) {
    const { error } = await supabase.from("notifications").insert(row);
    if (error && error.code !== "23505") {
      console.warn("insertNotifications", error.message);
    }
  }
  if (typeof window !== "undefined" && rows.length) {
    const { dispatchPushForNotifications } = await import("@/lib/push/client");
    dispatchPushForNotifications(rows);
  }
}

export function buildTaskCreateNotifications(input: {
  org_id: string;
  taskId: string;
  title: string;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  memberIds: string[];
}): AppNotification[] {
  const title = capitalizeLabel(input.title);
  const alerts: AppNotification[] = [];
  if (input.priority === "urgent") {
    const audience = input.assigned_to
      ? [input.assigned_to]
      : input.memberIds.filter((id) => id !== input.created_by);
    alerts.push(
      makeNotification({
        org_id: input.org_id,
        kind: "urgent_task",
        title: "Urgent task",
        body: title,
        href: "/tasks",
        entity_id: input.taskId,
        audience_profile_ids: audience.length ? audience : null,
      }),
    );
  } else if (input.assigned_to && input.assigned_to !== input.created_by) {
    alerts.push(
      makeNotification({
        org_id: input.org_id,
        kind: "task_assigned",
        title: "Task assigned to you",
        body: title,
        href: "/tasks",
        entity_id: input.taskId,
        audience_profile_ids: [input.assigned_to],
      }),
    );
  }
  return alerts;
}

export function buildBillCreateNotifications(input: {
  org_id: string;
  billId: string;
  description: string;
  amount: number;
  currency?: string;
  due_date: string | null;
  submitted_by: string;
  managerIds: string[];
}): AppNotification[] {
  const money = formatMoney(input.amount, input.currency ?? "THB");
  const managers = input.managerIds.filter((id) => id !== input.submitted_by);
  const alerts: AppNotification[] = [
    makeNotification({
      org_id: input.org_id,
      kind: "bill_submitted",
      title: "Bill submitted",
      body: `${input.description} · ${money}`,
      href: "/bills",
      entity_id: input.billId,
      audience_profile_ids: managers.length ? managers : null,
    }),
  ];
  if (input.due_date) {
    alerts.push(
      makeNotification({
        org_id: input.org_id,
        kind: "bill_due",
        title: `Bill due ${formatShortDate(input.due_date)}`,
        body: `${input.description} · ${money}`,
        href: "/bills",
        entity_id: input.billId,
        audience_profile_ids: managers.length
          ? [...new Set([...managers, input.submitted_by])]
          : null,
        dedupe_key: `bill_due_created:${input.billId}:${input.due_date}`,
      }),
    );
  }
  return alerts;
}

/** Notify the teammate when an owner/manager leaves weekly stars. */
export function buildEndorsementReceivedNotification(input: {
  org_id: string;
  fromProfileId: string;
  fromName: string;
  toProfileId: string;
  stars: 1 | 2 | 3 | 4 | 5;
  note?: string | null;
  weekKey: string;
}): AppNotification {
  const note = input.note?.trim();
  const body = note
    ? `${input.fromName} gave you ${input.stars}★ · ${note.slice(0, 120)}`
    : `${input.fromName} gave you ${input.stars}★ this week`;
  return makeNotification({
    org_id: input.org_id,
    kind: "endorsement",
    title: "New endorsement",
    body,
    href: "/endorsements",
    entity_id: input.toProfileId,
    audience_profile_ids: [input.toProfileId],
    dedupe_key: `endorsement_received:${input.org_id}:${input.fromProfileId}:${input.toProfileId}:${input.weekKey}`,
  });
}

export function buildVillaDateNotifications(input: {
  org_id: string;
  villaId: string;
  villaName: string;
  before: { check_in: string | null; check_out: string | null };
  patch: { check_in?: string | null; check_out?: string | null };
  audience_profile_ids?: string[] | null;
}): AppNotification[] {
  const alerts: AppNotification[] = [];
  if (
    input.patch.check_in !== undefined &&
    input.patch.check_in &&
    input.patch.check_in !== input.before.check_in
  ) {
    alerts.push(
      makeNotification({
        org_id: input.org_id,
        kind: "check_in",
        title: "Check-in updated",
        body: `${input.villaName} · ${formatShortDate(input.patch.check_in)}`,
        href: `/villas/${input.villaId}`,
        entity_id: input.villaId,
        audience_profile_ids: input.audience_profile_ids ?? null,
        dedupe_key: `check_in_set:${input.villaId}:${input.patch.check_in}`,
      }),
    );
  }
  if (
    input.patch.check_out !== undefined &&
    input.patch.check_out &&
    input.patch.check_out !== input.before.check_out
  ) {
    alerts.push(
      makeNotification({
        org_id: input.org_id,
        kind: "check_out",
        title: "Check-out updated",
        body: `${input.villaName} · ${formatShortDate(input.patch.check_out)}`,
        href: `/villas/${input.villaId}`,
        entity_id: input.villaId,
        audience_profile_ids: input.audience_profile_ids ?? null,
        dedupe_key: `check_out_set:${input.villaId}:${input.patch.check_out}`,
      }),
    );
  }
  return alerts;
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
 * Check-in/out alerts go to owners, managers, and staff assigned to that villa.
 * Bill-due alerts go to owners, managers, and the submitter.
 */
export function buildScheduleAlerts(input: {
  villas: Villa[];
  bills: Bill[];
  orders?: ServiceOrder[];
  existing: AppNotification[];
  profiles?: Profile[];
  assignments?: Pick<VillaAssignment, "villa_id" | "profile_id">[];
  endorsements?: Endorsement[];
  now?: Date;
}): AppNotification[] {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const profiles = input.profiles ?? [];
  const assignments = input.assignments ?? [];
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
        body: `${capitalizeLabel(order.service_type)} · ${order.location_label ?? "Villa"} · ${window}`,
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
      const audience = profiles.length
        ? villaOpsAudience(villa.org_id, villa.id, profiles, assignments)
        : null;
      push(
        makeNotification({
          org_id: villa.org_id,
          kind,
          title: `${label} ${when}`,
          body: `${villa.name} · ${formatShortDate(date)}`,
          href: `/villas/${villa.id}`,
          entity_id: villa.id,
          audience_profile_ids: audience && audience.length ? audience : null,
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
    const audience = profiles.length ? billDueAudience(bill, profiles) : null;
    push(
      makeNotification({
        org_id: bill.org_id,
        kind: "bill_due",
        title: `Bill ${when}`,
        body: `${bill.description} · ${formatMoney(Number(bill.amount), bill.currency)}`,
        href: "/bills",
        entity_id: bill.id,
        audience_profile_ids: audience && audience.length ? audience : null,
        dedupe_key,
      }),
    );
  }

  const week = weekKey(now);
  const orgIds = new Set(profiles.map((p) => p.org_id));
  for (const orgId of orgIds) {
    const teammates = profiles.filter(
      (p) => p.org_id === orgId && p.role !== "owner",
    );
    if (!teammates.length) continue;
    const owners = profiles.filter(
      (p) => p.org_id === orgId && p.role === "owner",
    );
    for (const owner of owners) {
      const votedIds = new Set(
        (input.endorsements ?? [])
          .filter(
            (e) =>
              e.org_id === orgId &&
              e.from_profile_id === owner.id &&
              e.week_key === week,
          )
          .map((e) => e.to_profile_id),
      );
      const remaining = teammates.filter((p) => !votedIds.has(p.id)).length;
      if (remaining <= 0) continue;
      push(
        makeNotification({
          org_id: orgId,
          kind: "endorsement",
          title: "Weekly endorsements",
          body: `Rate ${remaining} teammate${remaining === 1 ? "" : "s"} this week`,
          href: "/endorsements",
          audience_profile_ids: [owner.id],
          dedupe_key: `endorsement:${orgId}:${owner.id}:${week}`,
        }),
      );
    }
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
  bill_paid: { label: "Bill paid", tone: "text-secondary" },
  task_completed: { label: "Task done", tone: "text-secondary" },
  team_joined: { label: "Team", tone: "text-primary" },
  endorsement: { label: "Endorsement", tone: "text-primary" },
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

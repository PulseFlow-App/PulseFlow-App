import type { ServiceOrder, ServiceOrderStatus } from "@/lib/types";
import type { UserRole } from "@/lib/design-tokens";
import { formatWorkWindow } from "@/lib/notifications";
import type { MessageKey } from "@/lib/i18n";
import { canBookServices, isTaskAssignableRole } from "@/lib/roles";

type TFn = (key: MessageKey, params?: Record<string, string | number>) => string;

const MS_PER_HOUR = 60 * 60 * 1000;
/** UI cancel / revoke allowed until this many hours before the scheduled start. */
export const JOB_UI_CANCEL_HOURS_BEFORE = 24;

export function orderStatusLabel(status: ServiceOrderStatus, t?: TFn) {
  const key = `order.status.${status}` as MessageKey;
  if (t) return t(key);
  switch (status) {
    case "pending_ack":
      return "Awaiting Read & agreed";
    case "agreed":
      return "Confirmed";
    case "done":
      return "Done";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function orderReachabilityLabel(order: ServiceOrder, t?: TFn) {
  if (!order.staff_profile_id) {
    return t ? t("order.reach.open") : "Open job - awaiting agreement";
  }
  if (order.status === "pending_ack") {
    return t ? t("order.reach.pending") : "Not contacted (awaiting agreement)";
  }
  if (order.status === "agreed") {
    return t ? t("order.reach.confirmed") : "Confirmed in app";
  }
  return orderStatusLabel(order.status, t);
}

export function formatOrderWhen(
  order: Pick<ServiceOrder, "scheduled_date" | "time_start" | "time_end">,
) {
  return (
    formatWorkWindow(
      order.scheduled_date,
      order.time_start,
      order.time_end,
    ) ?? ""
  );
}

/** "at Location (when)" suffix for status chat lines — omits empty when / Soon. */
export function formatOrderAtWhen(
  location: string,
  order: Pick<ServiceOrder, "scheduled_date" | "time_start" | "time_end">,
) {
  const when = formatOrderWhen(order);
  return when ? `at ${location} (${when})` : `at ${location}`;
}

/** Join location · when without trailing separators when undated. */
export function formatOrderMeta(
  ...parts: Array<string | null | undefined>
) {
  return parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" · ");
}

/** Scheduled start as Date (local). Missing time → start of scheduled_date. */
export function orderScheduledStart(
  order: Pick<ServiceOrder, "scheduled_date" | "time_start">,
) {
  if (!order.scheduled_date) return null;
  const time = (order.time_start || "00:00").slice(0, 5);
  return new Date(`${order.scheduled_date}T${time}:00`);
}

export function hoursUntilOrderStart(
  order: Pick<ServiceOrder, "scheduled_date" | "time_start">,
) {
  const start = orderScheduledStart(order);
  if (!start) return Number.POSITIVE_INFINITY;
  return (start.getTime() - Date.now()) / MS_PER_HOUR;
}

/** True when the job is still more than 24h away (UI cancel/revoke allowed). */
export function canUseJobUiCancel(
  order: Pick<ServiceOrder, "scheduled_date" | "time_start">,
) {
  if (!order.scheduled_date) return true;
  return hoursUntilOrderStart(order) > JOB_UI_CANCEL_HOURS_BEFORE;
}

export function mentionLabel(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0] || fullName.trim();
  return `@${first}`;
}

/**
 * Team-chat copy for a job on Questions/Feedback.
 * "Read and agreed" is a separate button under the message — not in this text.
 * Assigned: "@Nok was assigned to Deep clean · Palm · today 09:00."
 * Open: "Job: Deep clean · Palm · today 09:00."
 * Undated jobs omit the when segment.
 */
export function buildOrderChatBody(input: {
  assigneeName?: string | null;
  serviceType: string;
  location: string;
  when?: string | null;
  details?: string | null;
  orderedBy?: string;
}) {
  const jobLine = [input.serviceType, input.location, input.when]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" · ");
  const lines: string[] = [];
  if (input.assigneeName?.trim()) {
    lines.push(
      `${mentionLabel(input.assigneeName)} was assigned to ${jobLine}.`,
    );
  } else {
    lines.push(`Job: ${jobLine}.`);
  }
  if (input.details?.trim()) lines.push(`Details: ${input.details.trim()}`);
  if (input.orderedBy?.trim()) lines.push(`From: ${input.orderedBy.trim()}`);
  return lines.join("\n");
}

/**
 * Assigned jobs stay private to the booker + assignee.
 * Open (unassigned) jobs stay visible to bookers and staff who can claim.
 */
export function canViewServiceOrder(
  actor: { id: string; role: UserRole },
  order: Pick<ServiceOrder, "staff_profile_id" | "ordered_by">,
  orgKind?: "personal" | "company" | null,
) {
  if (order.staff_profile_id) {
    return (
      order.staff_profile_id === actor.id || order.ordered_by === actor.id
    );
  }
  if (canBookServices(actor.role, orgKind)) return true;
  if (isTaskAssignableRole(actor.role)) return true;
  return false;
}

/** Job chat lines (service_order_id set) follow the linked order’s visibility. */
export function canViewServiceOrderMessage(
  actor: { id: string; role: UserRole },
  message: { service_order_id: string | null },
  orders: Pick<ServiceOrder, "id" | "staff_profile_id" | "ordered_by">[],
  orgKind?: "personal" | "company" | null,
) {
  if (!message.service_order_id) return true;
  const order = orders.find((o) => o.id === message.service_order_id);
  if (!order) return false;
  return canViewServiceOrder(actor, order, orgKind);
}

/** Staff can agree when assigned to them, or claim an open (unassigned) job. */
export function canAgreeServiceOrder(
  actor: { id: string; role: UserRole },
  order: ServiceOrder,
) {
  if (order.status !== "pending_ack") return false;
  if (order.staff_profile_id === actor.id) return true;
  if (!order.staff_profile_id && isTaskAssignableRole(actor.role)) return true;
  return false;
}

/** Undo accidental agreement while the job is still >24h away. */
export function canRevokeServiceOrderAgreement(
  actor: { id: string; role: UserRole },
  order: ServiceOrder,
) {
  if (order.status !== "agreed") return false;
  if (order.staff_profile_id !== actor.id) return false;
  return canUseJobUiCancel(order);
}

/**
 * Hard-cancel a job from the Jobs UI.
 * - Staff: decline while pending_ack, only if still >24h before start.
 * - Owners/managers: cancel anytime (pending or agreed) so they can reassign.
 * Within 24h, staff must use /cancel job in team chat.
 */
export function canCancelServiceOrder(
  actor: { id: string; role: UserRole },
  order: ServiceOrder,
  orgKind?: "personal" | "company" | null,
) {
  if (order.status === "done" || order.status === "cancelled") return false;
  if (canBookServices(actor.role, orgKind)) return true;
  if (
    order.staff_profile_id === actor.id &&
    order.status === "pending_ack" &&
    canUseJobUiCancel(order)
  ) {
    return true;
  }
  return false;
}

/** Owners/managers can reopen a cancelled/agreed/pending job with a new assignee (or open). */
export function canReopenServiceOrder(
  actor: { id: string; role: UserRole },
  order: ServiceOrder,
  orgKind?: "personal" | "company" | null,
) {
  if (!canBookServices(actor.role, orgKind)) return false;
  return (
    order.status === "pending_ack" ||
    order.status === "agreed" ||
    order.status === "cancelled"
  );
}

const CANCEL_JOB_RE = /^\/cancel\s+job(?:\s+(.+))?$/i;

export function parseCancelJobCommand(body: string): {
  matched: boolean;
  query: string | null;
} {
  const m = body.trim().match(CANCEL_JOB_RE);
  if (!m) return { matched: false, query: null };
  const query = m[1]?.trim() || null;
  return { matched: true, query };
}

/** Pick which open/agreed order /cancel job should cancel. */
export function resolveCancelJobTarget(
  orders: ServiceOrder[],
  actor: { id: string; role: UserRole },
  query: string | null,
): ServiceOrder | null {
  const active = orders.filter(
    (o) => o.status === "pending_ack" || o.status === "agreed",
  );
  const booker = canBookServices(actor.role, "company");
  let pool = active.filter((o) => {
    if (booker) return true;
    if (!o.staff_profile_id) return true;
    return o.staff_profile_id === actor.id;
  });
  if (query) {
    const q = query.toLowerCase();
    pool = pool.filter(
      (o) =>
        o.service_type.toLowerCase().includes(q) ||
        (o.location_label ?? "").toLowerCase().includes(q),
    );
  }
  if (!pool.length) return null;
  return [...pool].sort((a, b) => {
    const da = `${a.scheduled_date ?? ""}${a.time_start ?? ""}`;
    const db = `${b.scheduled_date ?? ""}${b.time_start ?? ""}`;
    return da.localeCompare(db);
  })[0]!;
}

import type { ServiceOrder, ServiceOrderStatus } from "@/lib/types";
import type { UserRole } from "@/lib/design-tokens";
import { formatWorkWindow } from "@/lib/notifications";
import type { MessageKey } from "@/lib/i18n";
import { canBookServices } from "@/lib/roles";

type TFn = (key: MessageKey, params?: Record<string, string | number>) => string;

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
    return t ? t("order.reach.offline") : "Not on app - call them";
  }
  if (order.status === "pending_ack") {
    return t ? t("order.reach.pending") : "Not contacted (awaiting agreement)";
  }
  if (order.status === "agreed") {
    return t ? t("order.reach.confirmed") : "Confirmed in app";
  }
  return orderStatusLabel(order.status, t);
}

export function formatOrderWhen(order: ServiceOrder) {
  return (
    formatWorkWindow(
      order.scheduled_date,
      order.time_start,
      order.time_end,
    ) ?? order.scheduled_date
  );
}

/** Staff can decline while awaiting ack. Owners/managers can cancel until done. */
export function canCancelServiceOrder(
  actor: { id: string; role: UserRole },
  order: ServiceOrder,
  orgKind?: "personal" | "company" | null,
) {
  if (order.status === "done" || order.status === "cancelled") return false;
  if (
    order.staff_profile_id === actor.id &&
    order.status === "pending_ack"
  ) {
    return true;
  }
  if (canBookServices(actor.role, orgKind)) return true;
  return false;
}

export function buildOrderChatBody(input: {
  contactName: string;
  serviceType: string;
  location: string;
  when: string;
  details?: string | null;
  orderedBy: string;
}) {
  const lines = [
    `📋 Service order for ${input.contactName}`,
    `What: ${input.serviceType}`,
    `Where: ${input.location}`,
    `When: ${input.when}`,
  ];
  if (input.details?.trim()) lines.push(`Details: ${input.details.trim()}`);
  lines.push(`From: ${input.orderedBy}`);
  lines.push("");
  lines.push(
    "Staff: open this and tap “Read and agreed” to confirm you got the job.",
  );
  return lines.join("\n");
}

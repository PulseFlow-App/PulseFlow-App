import { format, parseISO } from "date-fns";
import type { Bill, Profile, ServiceOrder } from "@/lib/types";
import { formatOrderWhen } from "@/lib/service-orders";
import type { MessageKey } from "@/lib/i18n";

export type JobProgressStepId =
  | "created"
  | "accepted"
  | "on_site"
  | "completed"
  | "cancelled";

export type JobProgressStep = {
  id: JobProgressStepId;
  titleKey: MessageKey;
  done: boolean;
  /** Display name for the actor on this step, if known. */
  actorName: string | null;
  /** Clock time HH:mm when the step happened. */
  clock: string | null;
  /** Extra i18n detail under Accepted (Read & agreed). */
  detailKey?: MessageKey;
};

export type JobProgressModel = {
  villaLabel: string;
  serviceType: string;
  status: ServiceOrder["status"];
  whenLabel: string;
  assigneeName: string | null;
  steps: JobProgressStep[];
  pendingBill: Bill | null;
};

function profileName(
  profiles: Profile[],
  id: string | null | undefined,
): string | null {
  if (!id) return null;
  return profiles.find((p) => p.id === id)?.full_name?.trim() || null;
}

function formatClock(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), "HH:mm");
  } catch {
    return null;
  }
}

/** Pending bill to surface under a job (same villa, prefer receipt). */
export function findPendingJobBill(
  order: Pick<ServiceOrder, "villa_id" | "org_id" | "status">,
  bills: Bill[],
): Bill | null {
  if (!order.villa_id) return null;
  if (order.status !== "done") return null;
  const sameVilla = bills.filter(
    (b) =>
      b.org_id === order.org_id &&
      b.villa_id === order.villa_id &&
      b.status === "pending",
  );
  if (sameVilla.length === 0) return null;
  return (
    sameVilla.find((b) => Boolean(b.receipt_photo_url)) ?? sameVilla[0] ?? null
  );
}

export function buildJobProgress(
  order: ServiceOrder,
  profiles: Profile[],
  bills: Bill[] = [],
): JobProgressModel {
  const creator = profileName(profiles, order.ordered_by);
  const staff = profileName(profiles, order.staff_profile_id);
  const whenLabel = formatOrderWhen(order);
  const cancelled = order.status === "cancelled";
  const acceptedDone =
    !cancelled &&
    (order.status === "agreed" ||
      order.status === "done" ||
      Boolean(order.agreed_at));
  const onSiteDone =
    !cancelled &&
    (Boolean(order.on_site_at) || order.status === "done");
  const completedDone = order.status === "done";

  const steps: JobProgressStep[] = [
    {
      id: "created",
      titleKey: "jobs.progress.created",
      done: true,
      actorName: creator,
      clock: formatClock(order.created_at),
    },
    {
      id: "accepted",
      titleKey: "jobs.progress.accepted",
      done: acceptedDone,
      actorName: acceptedDone ? staff : null,
      clock: acceptedDone ? formatClock(order.agreed_at) : null,
      detailKey: acceptedDone ? "jobs.readAgreed" : undefined,
    },
    {
      id: "on_site",
      titleKey: "jobs.progress.onSite",
      done: onSiteDone,
      actorName: onSiteDone ? staff : null,
      clock: onSiteDone ? formatClock(order.on_site_at ?? order.completed_at) : null,
    },
    {
      id: "completed",
      titleKey: "jobs.progress.completed",
      done: completedDone,
      actorName: completedDone ? staff : null,
      clock: completedDone ? formatClock(order.completed_at) : null,
    },
  ];

  if (cancelled) {
    steps[1]!.done = Boolean(order.agreed_at);
    steps[1]!.actorName = order.agreed_at ? staff : null;
    steps[1]!.clock = order.agreed_at ? formatClock(order.agreed_at) : null;
    steps[1]!.detailKey = order.agreed_at ? "jobs.readAgreed" : undefined;
    steps[2]!.done = Boolean(order.on_site_at);
    steps[2]!.actorName = order.on_site_at ? staff : null;
    steps[2]!.clock = order.on_site_at ? formatClock(order.on_site_at) : null;
    steps[3]!.done = false;
    steps.push({
      id: "cancelled",
      titleKey: "jobs.progress.cancelled",
      done: true,
      actorName: null,
      clock: null,
    });
  }

  return {
    villaLabel: order.location_label?.trim() || "Property",
    serviceType: order.service_type,
    status: order.status,
    whenLabel,
    assigneeName: staff,
    steps,
    pendingBill: findPendingJobBill(order, bills),
  };
}

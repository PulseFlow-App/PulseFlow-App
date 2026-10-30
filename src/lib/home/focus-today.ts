import type {
  ServiceOrder,
  TaskWithRelations,
  Villa,
  VillaCalendarBooking,
} from "@/lib/types";

export type FocusKind =
  | "urgent_task"
  | "due_task"
  | "verify_task"
  | "job"
  | "checkout"
  | "checkin"
  | "turnover"
  | "closed_task"
  | "closed_job";

export type FocusItem = {
  id: string;
  kind: FocusKind;
  /** Sort weight — lower = higher priority. */
  rank: number;
  title: string;
  subtitle?: string | null;
  href: string;
  /** Present when the focus row is a task. */
  task?: TaskWithRelations;
  /** Present when the focus row is a service order / job. */
  order?: ServiceOrder;
  closed?: boolean;
};

export type FocusTodayBundle = {
  open: FocusItem[];
  closed: FocusItem[];
  /** Open schedule reminders for the compact bookings strip. */
  schedule: FocusItem[];
};

function todayYmd(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function isOpenTask(task: TaskWithRelations) {
  return task.status === "open" || task.status === "pending_verify";
}

function isOpenJob(order: ServiceOrder) {
  return order.status !== "done" && order.status !== "cancelled";
}

function hasOpenTurnoverJob(
  orders: ServiceOrder[],
  villaId: string,
  day: string,
) {
  return orders.some(
    (o) =>
      o.villa_id === villaId &&
      isOpenJob(o) &&
      /turnover|clean/i.test(o.service_type) &&
      (o.scheduled_date === day || !o.scheduled_date),
  );
}

/**
 * Ranked “Focus of today” for owners/managers: open work first, then a short
 * closed trail, plus schedule reminders for a compact bookings strip.
 */
export function buildFocusToday(input: {
  tasks: TaskWithRelations[];
  serviceOrders: ServiceOrder[];
  villas: Villa[];
  calendarBookings?: VillaCalendarBooking[];
  today?: string;
  closedLimit?: number;
}): FocusTodayBundle {
  const today = input.today ?? todayYmd();
  const closedLimit = input.closedLimit ?? 5;
  const open: FocusItem[] = [];
  const closed: FocusItem[] = [];
  const schedule: FocusItem[] = [];
  const seen = new Set<string>();
  const scheduleKey = (kind: FocusKind, villaId: string, day: string) =>
    `${kind}:${villaId}:${day}`;

  const push = (
    list: FocusItem[],
    item: FocusItem,
    dedupeKey?: string,
  ) => {
    const key = dedupeKey ?? item.id;
    if (seen.has(key) || seen.has(item.id)) return;
    seen.add(key);
    seen.add(item.id);
    list.push(item);
  };

  for (const task of input.tasks) {
    if (!isOpenTask(task)) continue;
    const due = task.due_date?.slice(0, 10) ?? null;
    const dueTodayOrOverdue = Boolean(due && due <= today);

    if (task.status === "pending_verify") {
      push(open, {
        id: `task:${task.id}`,
        kind: "verify_task",
        rank: 5,
        title: task.title,
        subtitle: task.villa?.name ?? null,
        href: `/tasks?focus=${task.id}`,
        task,
      });
      continue;
    }

    if (task.priority === "urgent") {
      push(open, {
        id: `task:${task.id}`,
        kind: "urgent_task",
        rank: dueTodayOrOverdue ? 0 : 10,
        title: task.title,
        subtitle: task.villa?.name ?? null,
        href: `/tasks?focus=${task.id}`,
        task,
      });
      continue;
    }

    if (dueTodayOrOverdue || !due) {
      push(open, {
        id: `task:${task.id}`,
        kind: "due_task",
        rank: due && due < today ? 8 : due ? 20 : 24,
        title: task.title,
        subtitle: task.villa?.name ?? null,
        href: `/tasks?focus=${task.id}`,
        task,
      });
    }
  }

  for (const order of input.serviceOrders) {
    if (!isOpenJob(order)) continue;
    const day = order.scheduled_date?.slice(0, 10) ?? null;
    const relevant = !day || day <= today;
    if (!relevant) continue;
    const isTurnover = /turnover|clean/i.test(order.service_type);
    const overdue = Boolean(day && day < today);
    push(open, {
      id: `job:${order.id}`,
      kind: "job",
      rank:
        order.status === "pending_ack"
          ? isTurnover
            ? 12
            : 18
          : overdue
            ? 15
            : isTurnover
              ? 22
              : 35,
      title: order.service_type,
      subtitle: order.location_label,
      href: `/jobs?focus=${order.id}`,
      order,
    });
  }

  const villaName = (id: string) =>
    input.villas.find((v) => v.id === id)?.name ?? "Property";

  for (const villa of input.villas) {
    const checkOut = villa.check_out?.slice(0, 10) ?? null;
    const checkIn = villa.check_in?.slice(0, 10) ?? null;

    if (checkOut === today) {
      const booked = hasOpenTurnoverJob(
        input.serviceOrders,
        villa.id,
        today,
      );
      push(
        schedule,
        {
          id: `checkout:${villa.id}:${today}`,
          kind: "checkout",
          rank: booked ? 25 : 14,
          title: villa.name,
          subtitle: null,
          href: booked
            ? "/jobs"
            : `/contacts?bookVilla=${villa.id}&date=${today}&service=${encodeURIComponent("Turnover clean")}`,
        },
        scheduleKey("checkout", villa.id, today),
      );
    } else if (villa.status === "turnover") {
      push(
        schedule,
        {
          id: `turnover:${villa.id}`,
          kind: "turnover",
          rank: 16,
          title: villa.name,
          subtitle: null,
          href: `/villas/${villa.id}`,
        },
        scheduleKey("turnover", villa.id, today),
      );
    }

    if (checkIn === today) {
      push(
        schedule,
        {
          id: `checkin:${villa.id}:${today}`,
          kind: "checkin",
          rank: 28,
          title: villa.name,
          subtitle: null,
          href: `/villas/${villa.id}`,
        },
        scheduleKey("checkin", villa.id, today),
      );
    }
  }

  for (const booking of input.calendarBookings ?? []) {
    if (booking.status === "cancelled") continue;
    const checkOut = booking.check_out.slice(0, 10);
    const checkIn = booking.check_in.slice(0, 10);
    const name = villaName(booking.villa_id);

    if (checkOut === today) {
      const booked = hasOpenTurnoverJob(
        input.serviceOrders,
        booking.villa_id,
        today,
      );
      push(
        schedule,
        {
          id: `cal-checkout:${booking.id}`,
          kind: "checkout",
          rank: booked ? 26 : 14,
          title: name,
          subtitle: booking.summary,
          href: booked
            ? "/jobs"
            : `/contacts?bookVilla=${booking.villa_id}&date=${today}&service=${encodeURIComponent("Turnover clean")}`,
        },
        scheduleKey("checkout", booking.villa_id, today),
      );
    }
    if (checkIn === today) {
      push(
        schedule,
        {
          id: `cal-checkin:${booking.id}`,
          kind: "checkin",
          rank: 29,
          title: name,
          subtitle: booking.summary,
          href: `/villas/${booking.villa_id}`,
        },
        scheduleKey("checkin", booking.villa_id, today),
      );
    }
  }

  const closedCandidates: FocusItem[] = [];
  for (const task of input.tasks) {
    if (task.status !== "done") continue;
    const stamp = task.completed_at ?? task.created_at;
    closedCandidates.push({
      id: `closed-task:${task.id}`,
      kind: "closed_task",
      rank: -new Date(stamp).getTime(),
      title: task.title,
      subtitle: task.villa?.name ?? null,
      href: `/tasks?focus=${task.id}`,
      task,
      closed: true,
    });
  }
  for (const order of input.serviceOrders) {
    if (order.status !== "done") continue;
    const stamp = order.completed_at ?? order.created_at;
    closedCandidates.push({
      id: `closed-job:${order.id}`,
      kind: "closed_job",
      rank: -new Date(stamp).getTime(),
      title: order.service_type,
      subtitle: order.location_label,
      href: `/jobs?focus=${order.id}`,
      order,
      closed: true,
    });
  }
  closedCandidates.sort((a, b) => a.rank - b.rank);
  for (const item of closedCandidates.slice(0, closedLimit)) {
    closed.push(item);
  }

  const byRank = (a: FocusItem, b: FocusItem) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.title.localeCompare(b.title);
  };

  return {
    open: open.sort(byRank),
    closed,
    schedule: schedule.sort(byRank),
  };
}

/** Flat list for attention counts / legacy callers. */
export function flattenFocusToday(bundle: FocusTodayBundle): FocusItem[] {
  return [...bundle.open, ...bundle.schedule];
}

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
  | "turnover";

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
};

function todayYmd(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function isOpenTask(task: TaskWithRelations) {
  return task.status === "open" || task.status === "pending_verify";
}

function hasOpenTurnoverJob(
  orders: ServiceOrder[],
  villaId: string,
  day: string,
) {
  return orders.some(
    (o) =>
      o.villa_id === villaId &&
      o.status !== "done" &&
      o.status !== "cancelled" &&
      /turnover|clean/i.test(o.service_type) &&
      (o.scheduled_date === day || !o.scheduled_date),
  );
}

/**
 * Ranked “Focus of today” for owners/managers: urgent & due work, open jobs,
 * and schedule reminders (checkout / check-in / turnover status).
 */
export function buildFocusToday(input: {
  tasks: TaskWithRelations[];
  serviceOrders: ServiceOrder[];
  villas: Villa[];
  calendarBookings?: VillaCalendarBooking[];
  today?: string;
}): FocusItem[] {
  const today = input.today ?? todayYmd();
  const items: FocusItem[] = [];
  const seen = new Set<string>();
  /** Collapse duplicate schedule reminders for the same villa/day. */
  const scheduleKey = (kind: FocusKind, villaId: string, day: string) =>
    `${kind}:${villaId}:${day}`;

  const push = (item: FocusItem, dedupeKey?: string) => {
    const key = dedupeKey ?? item.id;
    if (seen.has(key) || seen.has(item.id)) return;
    seen.add(key);
    seen.add(item.id);
    items.push(item);
  };

  for (const task of input.tasks) {
    if (!isOpenTask(task)) continue;
    const due = task.due_date?.slice(0, 10) ?? null;
    const dueTodayOrOverdue = Boolean(due && due <= today);

    if (task.status === "pending_verify") {
      push({
        id: `task:${task.id}`,
        kind: "verify_task",
        rank: 5,
        title: task.title,
        subtitle: task.villa?.name ?? null,
        href: "/tasks",
        task,
      });
      continue;
    }

    if (task.priority === "urgent") {
      push({
        id: `task:${task.id}`,
        kind: "urgent_task",
        rank: dueTodayOrOverdue ? 0 : 10,
        title: task.title,
        subtitle: task.villa?.name ?? null,
        href: "/tasks",
        task,
      });
      continue;
    }

    if (dueTodayOrOverdue) {
      push({
        id: `task:${task.id}`,
        kind: "due_task",
        rank: due && due < today ? 8 : 20,
        title: task.title,
        subtitle: task.villa?.name ?? null,
        href: "/tasks",
        task,
      });
    }
  }

  for (const order of input.serviceOrders) {
    if (order.status === "done" || order.status === "cancelled") continue;
    const day = order.scheduled_date?.slice(0, 10) ?? null;
    const relevant = !day || day <= today;
    if (!relevant) continue;
    const isTurnover = /turnover|clean/i.test(order.service_type);
    const overdue = Boolean(day && day < today);
    push({
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
      href: "/jobs",
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

  return items.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.title.localeCompare(b.title);
  });
}

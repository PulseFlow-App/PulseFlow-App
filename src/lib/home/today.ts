import type { UserRole } from "@/lib/design-tokens";
import { canAgreeServiceOrder } from "@/lib/service-orders";
import type {
  Bill,
  Profile,
  ServiceOrder,
  TaskWithRelations,
  Villa,
  VillaCalendarBooking,
} from "@/lib/types";

export type TodayKind =
  | "arrival"
  | "departure"
  | "cleaning"
  | "maintenance"
  | "delivery";

export type TodayStatus =
  | "arriving"
  | "leaving"
  | "open"
  | "agreed"
  | "pending"
  | "needsCheck"
  | "overdue";

export type TodayAction = "open" | "agree" | "bookClean";

export type TodayRow = {
  id: string;
  kind: TodayKind;
  /** Minutes from local midnight. Null when the record has no clock time. */
  minutes: number | null;
  overdue: boolean;
  /** Owner marked the task urgent, and it is already on today's list. */
  hot?: boolean;
  property: string;
  title: string;
  status: TodayStatus;
  href: string;
  action: TodayAction;
  orderId?: string;
};

export type TodayIssue = {
  id: string;
  title: string;
  property: string;
  photoUrl: string | null;
  href: string;
};

export type TodayPerson = {
  id: string;
  name: string;
};

export type TodaySupply = {
  id: string;
  title: string;
  href: string;
};

export type TodayUrgent = {
  title: string;
  property: string;
  href: string;
  action: TodayAction;
  orderId?: string;
};

export type TodayModel = {
  rows: TodayRow[];
  issues: TodayIssue[];
  onDuty: TodayPerson[];
  supplies: TodaySupply[];
  urgent: TodayUrgent | null;
  photo: { src: string; name: string; href: string } | null;
};

export function localToday(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ymd(value: string | null | undefined) {
  return value ? value.slice(0, 10) : null;
}

function clockMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const stamped = value.match(/(?:T|\s)(\d{2}):(\d{2})/);
  if (stamped) {
    const h = Number(stamped[1]);
    const min = Number(stamped[2]);
    if (h === 0 && min === 0) return null;
    return h * 60 + min;
  }
  const plain = value.match(/^(\d{1,2}):(\d{2})/);
  if (!plain) return null;
  return Number(plain[1]) * 60 + Number(plain[2]);
}

function classify(text: string): TodayKind {
  if (/deliver|drop-?off|courier/i.test(text)) return "delivery";
  if (/clean|turnover|laundry|maid/i.test(text)) return "cleaning";
  return "maintenance";
}

const KIND_ORDER: Record<TodayKind, number> = {
  arrival: 0,
  departure: 1,
  cleaning: 2,
  maintenance: 3,
  delivery: 4,
};

function inProperty(villaId: string | null, propertyId: string | null) {
  if (!propertyId) return true;
  return villaId === propertyId;
}

function bookCleanHref(villaId: string, day: string) {
  return `/contacts?bookVilla=${villaId}&date=${day}&service=${encodeURIComponent("Turnover clean")}`;
}

export function buildToday(input: {
  today?: string;
  propertyId?: string | null;
  /** When set, the timeline is that person's tasks and jobs. */
  staffId?: string | null;
  actor: { id: string; role: UserRole };
  villas: Villa[];
  tasks: TaskWithRelations[];
  serviceOrders: ServiceOrder[];
  calendarBookings: VillaCalendarBooking[];
  bills: Bill[];
  profiles: Profile[];
}): TodayModel {
  const today = input.today ?? localToday();
  const propertyId = input.propertyId ?? null;
  const staffId = input.staffId ?? null;
  const villaName = (id: string | null | undefined) =>
    input.villas.find((v) => v.id === id)?.name ?? "";

  const rows: TodayRow[] = [];
  const seen = new Set<string>();
  const push = (row: TodayRow) => {
    if (seen.has(row.id)) return;
    seen.add(row.id);
    rows.push(row);
  };

  const openCleanVilla = new Set<string>();
  for (const order of input.serviceOrders) {
    if (order.status === "done" || order.status === "cancelled") continue;
    if (!/clean|turnover/i.test(order.service_type)) continue;
    const day = ymd(order.scheduled_date);
    if (day && day !== today && day > today) continue;
    if (order.villa_id) openCleanVilla.add(order.villa_id);
  }

  if (!staffId) {
    const schedule = new Map<string, TodayRow>();
    const putSchedule = (row: TodayRow) => {
      const prev = schedule.get(row.id);
      if (!prev) {
        schedule.set(row.id, row);
        return;
      }
      schedule.set(row.id, {
        ...prev,
        minutes: row.minutes ?? prev.minutes,
        title: row.title || prev.title,
      });
    };

    for (const villa of input.villas) {
      if (!inProperty(villa.id, propertyId)) continue;
      if (ymd(villa.check_in) === today) {
        putSchedule({
          id: `arrival:${villa.id}`,
          kind: "arrival",
          minutes: clockMinutes(villa.check_in),
          overdue: false,
          property: villa.name,
          title: "Arrival",
          status: "arriving",
          href: `/villas/${villa.id}`,
          action: "open",
        });
      }
      if (ymd(villa.check_out) === today) {
        const needsClean = !openCleanVilla.has(villa.id);
        putSchedule({
          id: `departure:${villa.id}`,
          kind: "departure",
          minutes: clockMinutes(villa.check_out),
          overdue: false,
          property: villa.name,
          title: "Departure",
          status: "leaving",
          href: needsClean
            ? bookCleanHref(villa.id, today)
            : `/villas/${villa.id}`,
          action: needsClean ? "bookClean" : "open",
        });
      }
    }

    for (const booking of input.calendarBookings) {
      if (booking.status === "cancelled") continue;
      if (!inProperty(booking.villa_id, propertyId)) continue;
      const name = villaName(booking.villa_id) || "Property";
      const guest = booking.summary?.trim() || "";
      if (ymd(booking.check_in) === today) {
        putSchedule({
          id: `arrival:${booking.villa_id}`,
          kind: "arrival",
          minutes: clockMinutes(booking.check_in),
          overdue: false,
          property: name,
          title: guest || "Arrival",
          status: "arriving",
          href: `/villas/${booking.villa_id}`,
          action: "open",
        });
      }
      if (ymd(booking.check_out) === today) {
        const needsClean = !openCleanVilla.has(booking.villa_id);
        putSchedule({
          id: `departure:${booking.villa_id}`,
          kind: "departure",
          minutes: clockMinutes(booking.check_out),
          overdue: false,
          property: name,
          title: guest || "Departure",
          status: "leaving",
          href: needsClean
            ? bookCleanHref(booking.villa_id, today)
            : `/villas/${booking.villa_id}`,
          action: needsClean ? "bookClean" : "open",
        });
      }
    }

    for (const row of schedule.values()) push(row);
  }

  const taskIdsOnJobs = new Set(
    input.serviceOrders
      .map((o) => o.task_id)
      .filter((id): id is string => Boolean(id)),
  );

  for (const task of input.tasks) {
    if (task.status === "done") continue;
    if (staffId && task.assigned_to !== staffId) continue;
    if (!inProperty(task.villa_id, propertyId)) continue;
    if (task.service_order_id || taskIdsOnJobs.has(task.id)) continue;
    const due = ymd(task.due_date);
    const overdue = Boolean(due && due < today);
    if (due && due > today) continue;
    const property = task.villa?.name || villaName(task.villa_id) || "Property";
    const minutes =
      clockMinutes(task.time_start) ??
      clockMinutes(task.time_slots?.[0] ?? null);
    push({
      id: `task:${task.id}`,
      kind: classify(task.title),
      minutes,
      overdue,
      hot: task.priority === "urgent",
      property,
      title: task.title,
      status:
        task.status === "pending_verify"
          ? "needsCheck"
          : overdue
            ? "overdue"
            : "open",
      href: `/tasks?focus=${task.id}`,
      action: "open",
    });
  }

  for (const order of input.serviceOrders) {
    if (order.status === "done" || order.status === "cancelled") continue;
    if (staffId) {
      const mine =
        order.staff_profile_id === staffId ||
        (!order.staff_profile_id && order.status === "pending_ack");
      if (!mine) continue;
    }
    if (!inProperty(order.villa_id, propertyId)) continue;
    const day = ymd(order.scheduled_date);
    const overdue = Boolean(day && day < today);
    if (day && day > today) continue;
    const property =
      villaName(order.villa_id) || order.location_label || "Property";
    const canAgree = canAgreeServiceOrder(input.actor, order);
    const minutes =
      clockMinutes(order.time_start) ??
      clockMinutes(order.time_slots?.[0] ?? null);
    push({
      id: `job:${order.id}`,
      kind: classify(order.service_type),
      minutes,
      overdue,
      property,
      title: order.service_type,
      status: canAgree ? "pending" : overdue ? "overdue" : order.status === "agreed" ? "agreed" : "open",
      href: `/jobs?focus=${order.id}`,
      action: canAgree ? "agree" : "open",
      orderId: canAgree ? order.id : undefined,
    });
  }

  rows.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    const am = a.minutes ?? 24 * 60 + 1;
    const bm = b.minutes ?? 24 * 60 + 1;
    if (am !== bm) return am - bm;
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  });

  const issues: TodayIssue[] = [];
  for (const task of input.tasks) {
    if (task.status === "done") continue;
    if (staffId && task.assigned_to !== staffId) continue;
    if (!inProperty(task.villa_id, propertyId)) continue;
    const photo = task.photo_url || task.verify_photo_url || null;
    issues.push({
      id: task.id,
      title: task.title,
      property: task.villa?.name || villaName(task.villa_id) || "Property",
      photoUrl: photo,
      href: `/tasks?focus=${task.id}`,
    });
  }
  issues.sort((a, b) => Number(Boolean(b.photoUrl)) - Number(Boolean(a.photoUrl)));

  const dutyIds = new Set<string>();
  for (const task of input.tasks) {
    if (task.status === "done" || !task.assigned_to) continue;
    const due = ymd(task.due_date);
    if (due && due > today) continue;
    if (!inProperty(task.villa_id, propertyId)) continue;
    dutyIds.add(task.assigned_to);
  }
  for (const order of input.serviceOrders) {
    if (order.status === "done" || order.status === "cancelled") continue;
    if (!order.staff_profile_id) continue;
    const day = ymd(order.scheduled_date);
    if (day && day > today) continue;
    if (!inProperty(order.villa_id, propertyId)) continue;
    dutyIds.add(order.staff_profile_id);
  }
  const onDuty: TodayPerson[] = input.profiles
    .filter((p) => dutyIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.full_name }));

  const supplies: TodaySupply[] = [];
  for (const bill of input.bills) {
    if (bill.category !== "supplies" || bill.status !== "pending") continue;
    if (!inProperty(bill.villa_id, propertyId)) continue;
    supplies.push({
      id: bill.id,
      title: bill.description,
      href: "/bills",
    });
  }

  const urgentRow =
    rows.find((r) => r.overdue) ??
    rows.find((r) => r.hot) ??
    rows.find((r) => r.status === "pending") ??
    rows.find((r) => r.action === "bookClean") ??
    null;

  const urgent: TodayUrgent | null = urgentRow
    ? {
        title: urgentRow.title,
        property: urgentRow.property,
        href: urgentRow.href,
        action: urgentRow.action,
        orderId: urgentRow.orderId,
      }
    : null;

  const photoVilla = propertyId
    ? input.villas.find((v) => v.id === propertyId && v.photo_url)
    : null;

  return {
    rows,
    issues: issues.slice(0, 4),
    onDuty,
    supplies: supplies.slice(0, 3),
    urgent,
    photo: photoVilla?.photo_url
      ? {
          src: photoVilla.photo_url,
          name: photoVilla.name,
          href: `/villas/${photoVilla.id}`,
        }
      : null,
  };
}

export function formatClock(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

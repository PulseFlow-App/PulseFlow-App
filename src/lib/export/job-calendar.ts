import type { ServiceOrder } from "@/lib/types";

const JOBS_URL = "https://app.pulseflow.site/jobs";

type CalendarOrder = Pick<
  ServiceOrder,
  | "id"
  | "service_type"
  | "details"
  | "location_label"
  | "scheduled_date"
  | "time_start"
  | "time_end"
  | "schedule_mode"
  | "time_slots"
  | "recurrence"
  | "recurrence_count"
  | "status"
  | "created_at"
>;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Local wall-clock → floating ICS local datetime (no Z). */
function toLocalIcsDateTime(date: string, timeHhMm: string) {
  const time = (timeHhMm || "09:00").slice(0, 5);
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return `${y}${pad2(m!)}${pad2(d!)}T${pad2(hh!)}${pad2(mm!)}00`;
}

function toUtcStamp(iso: string | Date = new Date()) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldIcsLine(line: string) {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join("\r\n");
}

function addMinutes(date: string, timeHhMm: string, minutes: number) {
  const start = new Date(`${date}T${(timeHhMm || "09:00").slice(0, 5)}:00`);
  start.setMinutes(start.getMinutes() + minutes);
  const y = start.getFullYear();
  const m = pad2(start.getMonth() + 1);
  const d = pad2(start.getDate());
  const hh = pad2(start.getHours());
  const mm = pad2(start.getMinutes());
  return {
    date: `${y}-${m}-${d}`,
    time: `${hh}:${mm}`,
  };
}

function recurrenceRule(order: CalendarOrder): string | null {
  if (order.recurrence === "once" || !order.recurrence) return null;
  const count = Math.min(Math.max(order.recurrence_count ?? 1, 1), 60);
  if (order.recurrence === "daily") {
    return `RRULE:FREQ=DAILY;COUNT=${count}`;
  }
  if (order.recurrence === "weekdays") {
    return `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=${count}`;
  }
  return null;
}

function eventWindows(order: CalendarOrder): Array<{
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}> {
  if (!order.scheduled_date) return [];

  if (order.schedule_mode === "slots" && order.time_slots?.length) {
    return order.time_slots
      .map((slot) => slot.slice(0, 5))
      .filter(Boolean)
      .map((slot) => {
        const end = addMinutes(order.scheduled_date!, slot, 60);
        return {
          startDate: order.scheduled_date!,
          startTime: slot,
          endDate: end.date,
          endTime: end.time,
        };
      });
  }

  const startTime = (order.time_start || "09:00").slice(0, 5);
  let endTime = (order.time_end || "").slice(0, 5);
  let endDate = order.scheduled_date;
  if (!endTime || endTime <= startTime) {
    const end = addMinutes(order.scheduled_date, startTime, 60);
    endDate = end.date;
    endTime = end.time;
  }
  return [
    {
      startDate: order.scheduled_date,
      startTime,
      endDate,
      endTime,
    },
  ];
}

function buildVEvent(
  order: CalendarOrder,
  window: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  },
  slotIndex: number,
  assigneeName?: string | null,
) {
  const uid =
    slotIndex > 0
      ? `job-${order.id}-slot${slotIndex}@pulseflow.site`
      : `job-${order.id}@pulseflow.site`;
  const summary = escapeIcsText(
    [order.service_type, order.location_label].filter(Boolean).join(" · "),
  );
  const descriptionParts = [
    order.details?.trim() || null,
    assigneeName ? `Assigned: ${assigneeName}` : null,
    `Status: ${order.status}`,
    JOBS_URL,
  ].filter(Boolean);
  const description = escapeIcsText(descriptionParts.join("\n"));
  const location = escapeIcsText(order.location_label?.trim() || "");
  const rrule = slotIndex === 0 ? recurrenceRule(order) : null;
  const status =
    order.status === "cancelled"
      ? "STATUS:CANCELLED"
      : order.status === "done"
        ? "STATUS:CONFIRMED"
        : "STATUS:TENTATIVE";

  const lines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp()}`,
    `DTSTART:${toLocalIcsDateTime(window.startDate, window.startTime)}`,
    `DTEND:${toLocalIcsDateTime(window.endDate, window.endTime)}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : null,
    location ? `LOCATION:${location}` : null,
    rrule,
    status,
    "END:VEVENT",
  ].filter((line): line is string => Boolean(line));

  return lines.map(foldIcsLine).join("\r\n");
}

/** True when the order has a date that can become a calendar event. */
export function orderHasCalendarSchedule(order: CalendarOrder) {
  return Boolean(order.scheduled_date) && eventWindows(order).length > 0;
}

export function buildJobCalendarIcs(
  orders: CalendarOrder[],
  opts?: {
    calendarName?: string;
    assigneeNameByOrderId?: Record<string, string | null | undefined>;
  },
) {
  const events = orders
    .filter(orderHasCalendarSchedule)
    .flatMap((order) => {
      const windows = eventWindows(order);
      return windows.map((window, index) =>
        buildVEvent(
          order,
          window,
          index,
          opts?.assigneeNameByOrderId?.[order.id],
        ),
      );
    });

  const name = escapeIcsText(opts?.calendarName?.trim() || "Pulse Flow Jobs");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pulse Flow//Jobs//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${name}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return `${body}\r\n`;
}

export function downloadIcs(filename: string, ics: string) {
  const blob = new Blob([ics], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Orders whose schedule falls in the local calendar week containing `ref`. */
export function ordersInLocalWeek(
  orders: CalendarOrder[],
  ref: Date = new Date(),
) {
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return orders.filter((order) => {
    if (!order.scheduled_date) return false;
    const day = new Date(`${order.scheduled_date}T12:00:00`);
    return day >= start && day < end;
  });
}

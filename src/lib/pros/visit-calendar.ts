import { downloadIcs } from "@/lib/export/job-calendar";

const TIMES: Record<string, string> = {
  morning: "09:00",
  afternoon: "13:00",
  evening: "17:00",
  any: "09:00",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoDay(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** Preferred date and time, as stored on a request, become one phone-calendar slot. */
export function visitSlot(whenLabel: string | null | undefined, now = new Date()) {
  const parts = (whenLabel ?? "")
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  let date: string | null = null;
  let time: string | null = null;
  for (const part of parts) {
    const token = part.toLowerCase();
    if (/^\d{4}-\d{2}-\d{2}/.test(part)) date = part.slice(0, 10);
    else if (token === "today") date = isoDay(now);
    else if (token === "tomorrow") date = isoDay(addDays(now, 1));
    else if (token === "this_week" || token === "this week" || token === "flexible") date = isoDay(addDays(now, 1));
    else if (TIMES[token]) time = TIMES[token];
    else if (/^\d{1,2}:\d{2}/.test(part)) {
      const [hour, minute] = part.split(":");
      time = `${pad2(Number(hour))}:${minute.slice(0, 2)}`;
    }
  }
  return { date: date ?? isoDay(addDays(now, 1)), time: time ?? "09:00" };
}

function plusHour(date: string, time: string) {
  const start = new Date(`${date}T${time}:00`);
  start.setMinutes(start.getMinutes() + 60);
  return {
    date: isoDay(start),
    time: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
  };
}

function stamp(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

export function buildVisitIcs(input: {
  id: string;
  title: string;
  whenLabel: string | null;
  details?: string | null;
  who?: string | null;
}) {
  const slot = visitSlot(input.whenLabel);
  const end = plusHour(slot.date, slot.time);
  const summary = escapeIcs([input.title, input.who].filter(Boolean).join(" · "));
  const description = escapeIcs(
    [input.details?.trim() || null, input.whenLabel?.trim() || null, input.who || null]
      .filter(Boolean)
      .join("\n"),
  );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pulseflow Services//Visits//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:visit-${input.id}@pulseflow.site`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
    `DTSTART:${stamp(slot.date, slot.time)}`,
    `DTEND:${stamp(end.date, end.time)}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Visit",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => Boolean(line));
  return `${lines.join("\r\n")}\r\n`;
}

export function downloadVisitIcs(input: {
  id: string;
  title: string;
  whenLabel: string | null;
  details?: string | null;
  who?: string | null;
}) {
  downloadIcs(`pulseflow-visit-${input.id.slice(0, 8)}.ics`, buildVisitIcs(input));
}

/** Preferred day plus one or more availability windows, e.g. "2026-11-09 · 09:00-12:00, 14:00-17:00". */

export type TimeInterval = { start: string; end: string };

const CLOCK = /^(\d{1,2}):(\d{2})$/;
const WINDOW = /^(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})$/;

export function isClockTime(value: string) {
  return CLOCK.test(value.trim());
}

export function normalizeClock(value: string) {
  const match = value.trim().match(CLOCK);
  if (!match) return value.trim();
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
}

export function formatInterval(interval: TimeInterval) {
  return `${normalizeClock(interval.start)}-${normalizeClock(interval.end)}`;
}

export function parseInterval(raw: string): TimeInterval | null {
  const match = raw.trim().match(WINDOW);
  if (!match) return null;
  const start = normalizeClock(match[1]);
  const end = normalizeClock(match[2]);
  if (start >= end) return null;
  return { start, end };
}

export function parseWhenLabel(label: string | null | undefined) {
  let date = "";
  const intervals: TimeInterval[] = [];
  let legacyTime: string | null = null;
  for (const part of (label ?? "").split("·").map((item) => item.trim()).filter(Boolean)) {
    if (/^\d{4}-\d{2}-\d{2}/.test(part)) {
      date = part.slice(0, 10);
      continue;
    }
    const token = part.toLowerCase();
    if (token === "morning" || token === "afternoon" || token === "evening" || token === "any") {
      legacyTime = token;
      continue;
    }
    if (isClockTime(part) && !part.includes("-")) {
      legacyTime = normalizeClock(part);
      continue;
    }
    for (const chunk of part.split(",").map((item) => item.trim()).filter(Boolean)) {
      const interval = parseInterval(chunk);
      if (interval) intervals.push(interval);
      else if (isClockTime(chunk)) legacyTime = normalizeClock(chunk);
    }
  }
  return { date, intervals, legacyTime };
}

export function buildWhenLabel(date: string, intervals: TimeInterval[]) {
  const windows = intervals.map(formatInterval).filter(Boolean);
  return [date, windows.join(", ")].filter(Boolean).join(" · ");
}

export function intervalsLabel(intervals: TimeInterval[]) {
  return intervals.map(formatInterval).join(", ");
}

export function clockToMinutes(value: string) {
  const [hour, minute] = normalizeClock(value).split(":").map(Number);
  return hour * 60 + minute;
}

export function intervalValid(interval: TimeInterval) {
  return isClockTime(interval.start) && isClockTime(interval.end) && clockToMinutes(interval.start) < clockToMinutes(interval.end);
}

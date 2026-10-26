/** Minimal VEVENT parser for Airbnb / Booking.com / VRBO export feeds. */

export type ParsedIcsEvent = {
  uid: string;
  summary: string | null;
  /** Inclusive check-in (YYYY-MM-DD). */
  checkIn: string;
  /** Checkout day (YYYY-MM-DD) — iCal DTEND exclusive for VALUE=DATE. */
  checkOut: string;
  status: "booked" | "blocked" | "cancelled";
};

function unfoldIcs(raw: string) {
  return raw.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function stripValueParams(line: string) {
  const colon = line.indexOf(":");
  if (colon < 0) return { name: line, value: "" };
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1).trim();
  const name = left.split(";")[0]!.toUpperCase();
  return { name, value, left };
}

/** Parse DATE or DATE-TIME → local YYYY-MM-DD. */
function parseIcsDate(raw: string): string | null {
  const cleaned = raw.trim().replace(/["']/g, "");
  const m = cleaned.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function addDaysYmd(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function classifyStatus(summary: string | null, icsStatus: string | null) {
  const status = (icsStatus || "").toUpperCase();
  if (status === "CANCELLED") return "cancelled" as const;
  const s = (summary || "").toLowerCase();
  if (
    /\b(blocked|not available|unavailable|closed|owner|maintenance)\b/.test(s)
  ) {
    return "blocked" as const;
  }
  return "booked" as const;
}

function parseEventBlock(block: string): ParsedIcsEvent | null {
  let uid: string | null = null;
  let summary: string | null = null;
  let dtStart: string | null = null;
  let dtEnd: string | null = null;
  let startIsDateOnly = false;
  let endIsDateOnly = false;
  let icsStatus: string | null = null;

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line === "BEGIN:VEVENT" || line === "END:VEVENT") continue;
    const { name, value, left } = stripValueParams(line);
    if (name === "UID") uid = value;
    else if (name === "SUMMARY") summary = value.replace(/\\n/g, " ").trim() || null;
    else if (name === "STATUS") icsStatus = value;
    else if (name === "DTSTART") {
      startIsDateOnly =
        /VALUE=DATE/i.test(left || "") || !value.includes("T");
      dtStart = parseIcsDate(value);
    } else if (name === "DTEND") {
      endIsDateOnly =
        /VALUE=DATE/i.test(left || "") || !value.includes("T");
      dtEnd = parseIcsDate(value);
    }
  }

  if (!dtStart) return null;
  let checkOut = dtEnd;
  if (!checkOut) {
    checkOut = addDaysYmd(dtStart, 1);
  } else if (startIsDateOnly && endIsDateOnly) {
    // DTEND exclusive for all-day — already the checkout day.
  } else if (checkOut === dtStart) {
    checkOut = addDaysYmd(dtStart, 1);
  }

  if (checkOut < dtStart) return null;

  const stableUid =
    uid?.trim() ||
    `anon-${dtStart}-${checkOut}-${(summary || "stay").slice(0, 40)}`;

  return {
    uid: stableUid,
    summary,
    checkIn: dtStart,
    checkOut,
    status: classifyStatus(summary, icsStatus),
  };
}

export function parseIcsEvents(icsText: string): ParsedIcsEvent[] {
  const text = unfoldIcs(icsText.replace(/^\uFEFF/, ""));
  const events: ParsedIcsEvent[] = [];
  const re = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const parsed = parseEventBlock(`BEGIN:VEVENT${match[1]}END:VEVENT`);
    if (parsed && parsed.status !== "cancelled") {
      events.push(parsed);
    }
  }
  return events;
}

export function detectIcalSource(
  url: string,
): "airbnb" | "booking" | "vrbo" | "ical" {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("airbnb.")) return "airbnb";
    if (host.includes("booking.com")) return "booking";
    if (host.includes("vrbo.") || host.includes("homeaway.")) return "vrbo";
  } catch {
    /* ignore */
  }
  return "ical";
}

/** Accept webcal:// and normalize to https. */
export function normalizeIcalUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const https = trimmed.replace(/^webcal:/i, "https:");
  try {
    const u = new URL(https);
    if (!/^https?:$/i.test(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

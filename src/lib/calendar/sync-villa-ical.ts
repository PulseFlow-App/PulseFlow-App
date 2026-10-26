import type { VillaCalendarBooking, VillaCalendarSource } from "@/lib/types";
import {
  detectIcalSource,
  normalizeIcalUrl,
  parseIcsEvents,
} from "@/lib/calendar/parse-ics";

export type IcalSyncResult = {
  imported: number;
  updated: number;
  cancelled: number;
  events: number;
  source: VillaCalendarSource;
  syncedAt: string;
  bookings: VillaCalendarBooking[];
};

export type ExistingCalendarBooking = Pick<
  VillaCalendarBooking,
  "id" | "external_uid" | "check_in" | "check_out" | "summary" | "status" | "source"
>;

/**
 * Pure merge: map feed events onto existing rows for a villa.
 * Callers persist inserts/updates/cancels.
 */
export function planIcalSync(input: {
  orgId: string;
  villaId: string;
  feedUrl: string;
  icsText: string;
  existing: ExistingCalendarBooking[];
  now?: string;
}): {
  source: VillaCalendarSource;
  syncedAt: string;
  toInsert: Omit<VillaCalendarBooking, "id">[];
  toUpdate: Array<{
    id: string;
    patch: Partial<VillaCalendarBooking>;
  }>;
  toCancelIds: string[];
  resultBookings: VillaCalendarBooking[];
} {
  const syncedAt = input.now ?? new Date().toISOString();
  const source = detectIcalSource(input.feedUrl);
  const events = parseIcsEvents(input.icsText);
  const byUid = new Map(
    input.existing.map((row) => [row.external_uid, row] as const),
  );
  const seen = new Set<string>();

  const toInsert: Omit<VillaCalendarBooking, "id">[] = [];
  const toUpdate: Array<{
    id: string;
    patch: Partial<VillaCalendarBooking>;
  }> = [];
  const resultBookings: VillaCalendarBooking[] = [];

  for (const event of events) {
    seen.add(event.uid);
    const prev = byUid.get(event.uid);
    if (!prev) {
      const row: Omit<VillaCalendarBooking, "id"> = {
        org_id: input.orgId,
        villa_id: input.villaId,
        external_uid: event.uid,
        source,
        summary: event.summary,
        check_in: event.checkIn,
        check_out: event.checkOut,
        status: event.status,
        last_seen_at: syncedAt,
        created_at: syncedAt,
      };
      toInsert.push(row);
      resultBookings.push({ id: `pending-${event.uid}`, ...row });
      continue;
    }
    const patch: Partial<VillaCalendarBooking> = {
      source,
      summary: event.summary,
      check_in: event.checkIn,
      check_out: event.checkOut,
      status: event.status,
      last_seen_at: syncedAt,
    };
    const changed =
      prev.check_in !== event.checkIn ||
      prev.check_out !== event.checkOut ||
      (prev.summary ?? null) !== (event.summary ?? null) ||
      prev.status !== event.status ||
      prev.source !== source;
    if (changed) {
      toUpdate.push({ id: prev.id, patch });
    } else {
      toUpdate.push({
        id: prev.id,
        patch: { last_seen_at: syncedAt },
      });
    }
    resultBookings.push({
      id: prev.id,
      org_id: input.orgId,
      villa_id: input.villaId,
      external_uid: event.uid,
      source,
      summary: event.summary,
      check_in: event.checkIn,
      check_out: event.checkOut,
      status: event.status,
      last_seen_at: syncedAt,
      created_at: syncedAt,
    });
  }

  const toCancelIds = input.existing
    .filter(
      (row) =>
        !seen.has(row.external_uid) &&
        row.status !== "cancelled" &&
        row.source !== "manual",
    )
    .map((row) => row.id);

  for (const id of toCancelIds) {
    const prev = input.existing.find((r) => r.id === id);
    if (!prev) continue;
    resultBookings.push({
      id: prev.id,
      org_id: input.orgId,
      villa_id: input.villaId,
      external_uid: prev.external_uid,
      source: prev.source,
      summary: prev.summary,
      check_in: prev.check_in,
      check_out: prev.check_out,
      status: "cancelled",
      last_seen_at: syncedAt,
      created_at: syncedAt,
    });
  }

  return {
    source,
    syncedAt,
    toInsert,
    toUpdate,
    toCancelIds,
    resultBookings,
  };
}

export async function fetchIcalText(feedUrl: string): Promise<string> {
  const normalized = normalizeIcalUrl(feedUrl);
  if (!normalized) throw new Error("Invalid calendar URL");

  const res = await fetch(normalized, {
    headers: {
      Accept: "text/calendar, text/plain, */*",
      "Cache-Control": "no-cache",
      "User-Agent": "PulseFlow-CalendarSync/1.0",
    },
    signal: AbortSignal.timeout(20000),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Calendar feed returned ${res.status}`);
  }

  const text = await res.text();
  if (!/BEGIN:VCALENDAR/i.test(text)) {
    throw new Error("URL did not return a calendar (.ics) feed");
  }
  return text;
}

/** Next upcoming or current booking for villa pulse dates. */
export function pickPulseStayDates(
  bookings: Array<{
    check_in: string;
    check_out: string;
    status: string;
  }>,
  todayYmd = new Date().toISOString().slice(0, 10),
) {
  const open = bookings
    .filter(
      (b) =>
        (b.status === "booked" || b.status === "blocked") &&
        b.check_out >= todayYmd,
    )
    .sort((a, b) => a.check_in.localeCompare(b.check_in));

  const current = open.find(
    (b) => b.check_in <= todayYmd && b.check_out >= todayYmd,
  );
  const next = current ?? open[0] ?? null;
  if (!next) {
    return { check_in: null as string | null, check_out: null as string | null };
  }
  return { check_in: next.check_in, check_out: next.check_out };
}

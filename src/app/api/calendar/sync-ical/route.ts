import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { fetchIcalText } from "@/lib/calendar/fetch-ical-text";
import {
  pickPulseStayDates,
  planIcalSync,
} from "@/lib/calendar/sync-villa-ical";
import { normalizeIcalUrl } from "@/lib/calendar/parse-ics";
import type { VillaCalendarBooking } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Pull a villa's Airbnb / Booking.com / VRBO iCal export into villa_calendar_bookings.
 * Body: { villaId: string, feedUrl?: string }
 */
export async function POST(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json(
      {
        error:
          "Demo mode syncs from the client. Use Sync on the property screen.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { villaId?: string; feedUrl?: string };
  try {
    body = (await request.json()) as { villaId?: string; feedUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const villaId = body.villaId?.trim();
  if (!villaId) {
    return NextResponse.json({ error: "villaId required" }, { status: 400 });
  }

  const { data: villa, error: villaErr } = await supabase
    .from("villas")
    .select("id, org_id, ical_import_url, name")
    .eq("id", villaId)
    .maybeSingle();

  if (villaErr || !villa) {
    return NextResponse.json(
      { error: villaErr?.message || "Villa not found" },
      { status: 404 },
    );
  }

  const feedUrl =
    normalizeIcalUrl(body.feedUrl || "") ||
    normalizeIcalUrl(villa.ical_import_url || "");
  if (!feedUrl) {
    return NextResponse.json(
      { error: "Paste an Airbnb or Booking.com calendar export URL first" },
      { status: 400 },
    );
  }

  let icsText: string;
  try {
    icsText = await fetchIcalText(feedUrl);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not fetch calendar feed",
      },
      { status: 502 },
    );
  }

  const { data: existingRows, error: existingErr } = await supabase
    .from("villa_calendar_bookings")
    .select("id, external_uid, check_in, check_out, summary, status, source")
    .eq("villa_id", villaId);

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  const plan = planIcalSync({
    orgId: villa.org_id as string,
    villaId,
    feedUrl,
    icsText,
    existing: (existingRows as VillaCalendarBooking[]) ?? [],
  });

  if (plan.toInsert.length) {
    const { error } = await supabase
      .from("villa_calendar_bookings")
      .insert(plan.toInsert);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (const row of plan.toUpdate) {
    const { error } = await supabase
      .from("villa_calendar_bookings")
      .update(row.patch)
      .eq("id", row.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (plan.toCancelIds.length) {
    const { error } = await supabase
      .from("villa_calendar_bookings")
      .update({ status: "cancelled", last_seen_at: plan.syncedAt })
      .in("id", plan.toCancelIds);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data: fresh, error: freshErr } = await supabase
    .from("villa_calendar_bookings")
    .select("*")
    .eq("villa_id", villaId)
    .neq("status", "cancelled");

  if (freshErr) {
    return NextResponse.json({ error: freshErr.message }, { status: 500 });
  }

  const bookings = (fresh as VillaCalendarBooking[]) ?? [];
  const pulse = pickPulseStayDates(bookings);

  await supabase
    .from("villas")
    .update({
      ical_import_url: feedUrl,
      ical_synced_at: plan.syncedAt,
      ...(pulse.check_in
        ? {
            check_in: pulse.check_in,
            check_out: pulse.check_out,
            status: "occupied",
          }
        : {}),
    })
    .eq("id", villaId);

  return NextResponse.json({
    imported: plan.toInsert.length,
    updated: plan.toUpdate.length,
    cancelled: plan.toCancelIds.length,
    events: bookings.length,
    source: plan.source,
    syncedAt: plan.syncedAt,
    bookings,
  });
}

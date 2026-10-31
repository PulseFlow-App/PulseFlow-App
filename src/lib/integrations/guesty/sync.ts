import { createAdminClient } from "@/lib/supabase/admin";
import { fetchIcalText } from "@/lib/calendar/fetch-ical-text";
import { planIcalSync } from "@/lib/calendar/sync-villa-ical";
import { normalizeIcalUrl } from "@/lib/calendar/parse-ics";
import type { VillaCalendarBooking } from "@/lib/types";
import {
  guestyEnsureExportIcalUrl,
  guestyGetAccessToken,
  guestyListListings,
  type GuestyListing,
} from "@/lib/integrations/guesty/client";
import { decryptSecret } from "@/lib/integrations/secrets";

export type GuestySyncSummary = {
  listingsSeen: number;
  created: number;
  updated: number;
  calendarsLinked: number;
  calendarsSynced: number;
  skipped: number;
  errors: string[];
};

function locationForListing(listing: GuestyListing): string {
  if (listing.address?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address.trim())}`;
  }
  return `https://www.guesty.com/listings/${encodeURIComponent(listing.id)}`;
}

export async function syncGuestyOrg(input: {
  orgId: string;
  profileId: string;
  clientIdCipher: string;
  clientSecretCipher: string;
}): Promise<GuestySyncSummary> {
  const clientId = decryptSecret(input.clientIdCipher);
  const clientSecret = decryptSecret(input.clientSecretCipher);
  const token = await guestyGetAccessToken(clientId, clientSecret);
  const listings = await guestyListListings(token);
  const admin = createAdminClient();

  const summary: GuestySyncSummary = {
    listingsSeen: listings.length,
    created: 0,
    updated: 0,
    calendarsLinked: 0,
    calendarsSynced: 0,
    skipped: 0,
    errors: [],
  };

  const { data: existingVillas } = await admin
    .from("villas")
    .select("id, guesty_listing_id, name, ical_import_url")
    .eq("org_id", input.orgId);

  const byGuesty = new Map(
    (existingVillas ?? [])
      .filter((v) => v.guesty_listing_id)
      .map((v) => [v.guesty_listing_id as string, v]),
  );

  for (const listing of listings) {
    try {
      let villaId = byGuesty.get(listing.id)?.id as string | undefined;
      const icalUrlRaw = await guestyEnsureExportIcalUrl(token, listing.id);
      const icalUrl = icalUrlRaw ? normalizeIcalUrl(icalUrlRaw) : null;

      if (!villaId) {
        const name =
          listing.nickname?.trim() || listing.title.trim() || `Guesty listing`;
        const insert = await admin
          .from("villas")
          .insert({
            org_id: input.orgId,
            name,
            area: listing.address?.split(",").slice(-2).join(",").trim() || null,
            location_url: locationForListing(listing),
            description: listing.title !== name ? listing.title : null,
            photo_url: listing.pictureUrl,
            listing_url: `https://app.guesty.com/properties/${listing.id}`,
            source_notes: `Imported from Guesty listing ${listing.id}`,
            ical_import_url: icalUrl,
            guesty_listing_id: listing.id,
            status: "available",
            cleaning_status: "not_needed",
            created_by: input.profileId,
          })
          .select("id")
          .single();

        if (insert.error || !insert.data) {
          // Column may be missing before migration — retry without guesty id.
          if (
            insert.error?.message &&
            /guesty_listing_id/i.test(insert.error.message)
          ) {
            summary.errors.push(
              `${listing.title}: run migration 064 (guesty_listing_id missing)`,
            );
            summary.skipped += 1;
            continue;
          }
          summary.errors.push(
            `${listing.title}: ${insert.error?.message ?? "create failed"}`,
          );
          summary.skipped += 1;
          continue;
        }
        villaId = insert.data.id as string;
        summary.created += 1;
        if (icalUrl) summary.calendarsLinked += 1;
      } else {
        const patch: Record<string, unknown> = {
          name:
            listing.nickname?.trim() ||
            listing.title.trim() ||
            byGuesty.get(listing.id)?.name,
          updated_at: new Date().toISOString(),
        };
        if (listing.pictureUrl) patch.photo_url = listing.pictureUrl;
        if (icalUrl) {
          patch.ical_import_url = icalUrl;
          summary.calendarsLinked += 1;
        }
        const { error } = await admin
          .from("villas")
          .update(patch)
          .eq("id", villaId);
        if (error) {
          summary.errors.push(`${listing.title}: ${error.message}`);
          summary.skipped += 1;
          continue;
        }
        summary.updated += 1;
      }

      if (villaId && icalUrl) {
        try {
          const icsText = await fetchIcalText(icalUrl);
          const { data: existingRows } = await admin
            .from("villa_calendar_bookings")
            .select(
              "id, external_uid, check_in, check_out, summary, status, source",
            )
            .eq("villa_id", villaId);

          const plan = planIcalSync({
            orgId: input.orgId,
            villaId,
            feedUrl: icalUrl,
            icsText,
            existing: (existingRows as VillaCalendarBooking[]) ?? [],
          });

          if (plan.toInsert.length) {
            await admin.from("villa_calendar_bookings").insert(plan.toInsert);
          }
          for (const row of plan.toUpdate) {
            await admin
              .from("villa_calendar_bookings")
              .update(row.patch)
              .eq("id", row.id);
          }
          if (plan.toCancelIds.length) {
            await admin
              .from("villa_calendar_bookings")
              .update({ status: "cancelled", last_seen_at: plan.syncedAt })
              .in("id", plan.toCancelIds);
          }
          await admin
            .from("villas")
            .update({
              ical_import_url: icalUrl,
              ical_synced_at: plan.syncedAt,
            })
            .eq("id", villaId);
          summary.calendarsSynced += 1;
        } catch (e) {
          summary.errors.push(
            `${listing.title} calendar: ${
              e instanceof Error ? e.message : "sync failed"
            }`,
          );
        }
      }
    } catch (e) {
      summary.errors.push(
        `${listing.title}: ${e instanceof Error ? e.message : "failed"}`,
      );
      summary.skipped += 1;
    }
  }

  return summary;
}
